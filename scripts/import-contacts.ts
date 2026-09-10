import "dotenv/config";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../src/lib/db";
import { ImportStatus, PatientEntryType, ReferralCategory } from "@prisma/client";

interface CliArgs {
  file?: string;
  type?: "patients" | "referrals";
  dryRun: boolean;
  commit: boolean;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let file: string | undefined;
  let type: "patients" | "referrals" | undefined;
  let commit = false;
  let dryRun = true;

  for (const arg of args) {
    if (arg.startsWith("--file=")) {
      file = arg.slice(7).trim();
    } else if (arg.startsWith("--type=")) {
      const val = arg.slice(7).trim().toLowerCase();
      if (val === "patients" || val === "referrals") {
        type = val;
      }
    } else if (arg === "--commit") {
      commit = true;
      dryRun = false;
    } else if (arg === "--dry-run") {
      dryRun = true;
      commit = false;
    }
  }

  return { file, type, dryRun, commit };
}

interface PreparedPatient {
  fullName: string;
  phone: string | null;
  phoneAlt: string | null;
  entryType: PatientEntryType;
  relationNote: string | null;
  importStatus: ImportStatus;
  importReason: string | null;
  rawContactName: string;
  rawPhone: string;
}

interface PreparedReferral {
  name: string;
  phone: string | null;
  phoneAlt: string | null;
  category: ReferralCategory;
  specialty: string | null;
  location: string | null;
  organisation: string | null;
  importStatus: ImportStatus;
  importReason: string | null;
  rawContactName: string;
  rawPhone: string;
}

const INDIAN_MOBILE_REGEX = /^\+91[6-9]\d{9}$/;

async function main() {
  const { file, type, dryRun, commit } = parseArgs();

  if (!file) {
    console.error("Error: --file=<path> is required.");
    process.exit(1);
  }
  if (!type) {
    console.error("Error: --type=patients|referrals is required.");
    process.exit(1);
  }

  const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  console.log(`\nStarting Contact Importer`);
  console.log(`File: ${filePath}`);
  console.log(`Type: ${type}`);
  console.log(`Mode: ${commit ? "COMMIT (writes enabled)" : "DRY RUN (no writes)"}\n`);

  const fileContent = fs.readFileSync(filePath, "utf8");
  const records: Record<string, string>[] = parse(fileContent, {
    columns: true,
    bom: true,
    trim: false,
    skip_empty_lines: true,
  });

  const rowsRead = records.length;
  let rowsCreated = 0;
  let rowsUpdated = 0;
  let rowsSkipped = 0;
  let rowsFlagged = 0;

  // Track previous batch runs for human-edit conflict check
  const latestBatch = await prisma.importBatch.findFirst({
    where: { fileName: path.basename(filePath) },
    orderBy: { runAt: "desc" },
  });

  if (type === "patients") {
    // Process patients
    const preparedPatients: PreparedPatient[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rawName = row.name || "";
      const cleanedName = rawName.trim();
      const rawContactName = row.raw_contact_name?.trim() || cleanedName || "Unknown";
      const rawPhone = row.raw_phone?.trim() || "";
      let phoneE164 = row.phone_e164?.trim() || null;
      const phoneAlt = row.phone_alt?.trim() || null;
      const relationNote = row.relation_note?.trim() || null;
      const entryTypeStr = (row.entry_type || "").trim().toUpperCase();
      const entryType: PatientEntryType =
        entryTypeStr === "LINKED_CONTACT" ? PatientEntryType.LINKED_CONTACT : PatientEntryType.PATIENT;

      let importStatus: ImportStatus =
        (row.needs_review || "").trim().toLowerCase() === "yes"
          ? ImportStatus.NEEDS_REVIEW
          : ImportStatus.ACTIVE;

      const reviewReasons: string[] = [];
      if (row.review_reason?.trim()) {
        reviewReasons.push(row.review_reason.trim());
      }

      // Validation 1: Blank Name
      if (!cleanedName) {
        importStatus = ImportStatus.NEEDS_REVIEW;
        if (!reviewReasons.some((r) => r.toLowerCase().includes("name"))) {
          reviewReasons.push("Blank contact name");
        }
      }

      // Validation 2: Phone formatting
      if (phoneE164) {
        if (phoneE164.startsWith("+91")) {
          if (!INDIAN_MOBILE_REGEX.test(phoneE164)) {
            importStatus = ImportStatus.NEEDS_REVIEW;
            if (!reviewReasons.some((r) => r.toLowerCase().includes("phone") || r.toLowerCase().includes("format"))) {
              reviewReasons.push("Invalid Indian mobile format");
            }
          }
        }
      } else {
        importStatus = ImportStatus.NEEDS_REVIEW;
        reviewReasons.push("Missing phone number");
      }

      if (importStatus === ImportStatus.NEEDS_REVIEW) {
        rowsFlagged++;
      }

      preparedPatients.push({
        fullName: cleanedName || "Unknown",
        phone: phoneE164,
        phoneAlt,
        entryType,
        relationNote,
        importStatus,
        importReason: reviewReasons.length > 0 ? reviewReasons.join("; ") : null,
        rawContactName,
        rawPhone: rawPhone || phoneE164 || "",
      });
    }

    if (!commit) {
      // Dry run: simulate against current DB
      for (const p of preparedPatients) {
        if (!p.phone) continue;
        const existing = await prisma.patient.findUnique({
          where: { phone: p.phone },
          include: { importBatch: true },
        });

        if (!existing) {
          rowsCreated++;
        } else {
          // Check human edit protection
          if (latestBatch && existing.updatedAt > latestBatch.runAt) {
            rowsSkipped++;
          } else {
            rowsUpdated++;
          }
        }
      }
    } else {
      // Commit within a transaction
      try {
        await prisma.$transaction(
          async (tx) => {
            // Create the batch record first
            const batch = await tx.importBatch.create({
              data: {
                fileName: path.basename(filePath),
                rowsRead,
                rowsCreated: 0,
                rowsUpdated: 0,
                rowsSkipped: 0,
                rowsFlagged,
              },
            });

            for (const p of preparedPatients) {
              if (!p.phone) continue;
              const existing = await tx.patient.findUnique({
                where: { phone: p.phone },
              });

              if (!existing) {
                await tx.patient.create({
                  data: {
                    fullName: p.fullName,
                    phone: p.phone,
                    gender: null,
                    dateOfBirth: null,
                    phoneAlt: p.phoneAlt,
                    entryType: p.entryType,
                    relationNote: p.relationNote,
                    importStatus: p.importStatus,
                    importReason: p.importReason,
                    rawContactName: p.rawContactName,
                    rawPhone: p.rawPhone,
                    importBatchId: batch.id,
                  },
                });
                rowsCreated++;
              } else {
                // Check if human edited after previous batch
                if (latestBatch && existing.updatedAt > latestBatch.runAt) {
                  rowsSkipped++;
                } else {
                  await tx.patient.update({
                    where: { id: existing.id },
                    data: {
                      phoneAlt: p.phoneAlt ?? existing.phoneAlt,
                      entryType: p.entryType,
                      relationNote: p.relationNote ?? existing.relationNote,
                      importStatus: p.importStatus,
                      importReason: p.importReason ?? existing.importReason,
                      rawContactName: p.rawContactName ?? existing.rawContactName,
                      rawPhone: p.rawPhone ?? existing.rawPhone,
                      importBatchId: batch.id,
                    },
                  });
                  rowsUpdated++;
                }
              }
            }

            // Update batch counts
            await tx.importBatch.update({
              where: { id: batch.id },
              data: {
                rowsCreated,
                rowsUpdated,
                rowsSkipped,
              },
            });
          },
          { maxWait: 20000, timeout: 120000 }
        );
      } catch (err: any) {
        console.error("Transaction failed:", err);
        await prisma.importBatch.create({
          data: {
            fileName: path.basename(filePath),
            rowsRead,
            rowsCreated,
            rowsUpdated,
            rowsSkipped,
            rowsFlagged,
            errors: { message: err.message, stack: err.stack },
          },
        });
        process.exit(1);
      }
    }
  } else if (type === "referrals") {
    // Process referrals
    const preparedReferrals: PreparedReferral[] = [];

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      const rawName = row.name || "";
      const cleanedName = rawName.trim();
      const rawContactName = row.raw_contact_name?.trim() || cleanedName || "Unknown";
      const rawPhone = row.raw_phone?.trim() || "";
      let phoneE164 = row.phone_e164?.trim() || null;
      const phoneAlt = row.phone_alt?.trim() || null;
      const specialty = row.specialty?.trim() || null;
      const location = row.location?.trim() || null;
      const organisation = row.org?.trim() || null;

      const catStr = (row.category || "").trim().toUpperCase();
      let category: ReferralCategory = ReferralCategory.DOCTOR;
      if (catStr === "PHYSIOTHERAPIST") category = ReferralCategory.PHYSIOTHERAPIST;
      else if (catStr === "FACILITY") category = ReferralCategory.FACILITY;
      else if (catStr === "VENDOR") category = ReferralCategory.VENDOR;

      let importStatus: ImportStatus =
        (row.needs_review || "").trim().toLowerCase() === "yes"
          ? ImportStatus.NEEDS_REVIEW
          : ImportStatus.ACTIVE;

      const reviewReasons: string[] = [];
      if (row.review_reason?.trim()) {
        reviewReasons.push(row.review_reason.trim());
      }

      if (!cleanedName) {
        importStatus = ImportStatus.NEEDS_REVIEW;
        reviewReasons.push("Blank contact name");
      }

      if (!phoneE164) {
        importStatus = ImportStatus.NEEDS_REVIEW;
        if (!reviewReasons.some((r) => r.toLowerCase().includes("phone") || r.toLowerCase().includes("number"))) {
          reviewReasons.push("Missing phone number");
        }
      }

      if (importStatus === ImportStatus.NEEDS_REVIEW) {
        rowsFlagged++;
      }

      preparedReferrals.push({
        name: cleanedName || "Unknown",
        phone: phoneE164,
        phoneAlt,
        category,
        specialty,
        location,
        organisation,
        importStatus,
        importReason: reviewReasons.length > 0 ? reviewReasons.join("; ") : null,
        rawContactName,
        rawPhone: rawPhone || phoneE164 || "",
      });
    }

    if (!commit) {
      for (const r of preparedReferrals) {
        const existing = r.phone
          ? await prisma.referralContact.findUnique({ where: { phone: r.phone } })
          : await prisma.referralContact.findFirst({ where: { rawContactName: r.rawContactName } });

        if (!existing) {
          rowsCreated++;
        } else {
          if (latestBatch && existing.updatedAt > latestBatch.runAt) {
            rowsSkipped++;
          } else {
            rowsUpdated++;
          }
        }
      }
    } else {
      try {
        await prisma.$transaction(
          async (tx) => {
            const batch = await tx.importBatch.create({
              data: {
                fileName: path.basename(filePath),
                rowsRead,
                rowsCreated: 0,
                rowsUpdated: 0,
                rowsSkipped: 0,
                rowsFlagged,
              },
            });

            for (const r of preparedReferrals) {
              const existing = r.phone
                ? await tx.referralContact.findUnique({ where: { phone: r.phone } })
                : await tx.referralContact.findFirst({ where: { rawContactName: r.rawContactName } });

              if (!existing) {
                await tx.referralContact.create({
                  data: {
                    name: r.name,
                    phone: r.phone,
                    phoneAlt: r.phoneAlt,
                    category: r.category,
                    specialty: r.specialty,
                    location: r.location,
                    organisation: r.organisation,
                    importStatus: r.importStatus,
                    importReason: r.importReason,
                    rawContactName: r.rawContactName,
                    rawPhone: r.rawPhone,
                    importBatchId: batch.id,
                  },
                });
                rowsCreated++;
              } else {
                if (latestBatch && existing.updatedAt > latestBatch.runAt) {
                  rowsSkipped++;
                } else {
                  await tx.referralContact.update({
                    where: { id: existing.id },
                    data: {
                      name: r.name,
                      phoneAlt: r.phoneAlt ?? existing.phoneAlt,
                      category: r.category,
                      specialty: r.specialty ?? existing.specialty,
                      location: r.location ?? existing.location,
                      organisation: r.organisation ?? existing.organisation,
                      importStatus: r.importStatus,
                      importReason: r.importReason ?? existing.importReason,
                      rawContactName: r.rawContactName ?? existing.rawContactName,
                      rawPhone: r.rawPhone ?? existing.rawPhone,
                      importBatchId: batch.id,
                    },
                  });
                  rowsUpdated++;
                }
              }
            }

            await tx.importBatch.update({
              where: { id: batch.id },
              data: {
                rowsCreated,
                rowsUpdated,
                rowsSkipped,
              },
            });
          },
          { maxWait: 20000, timeout: 120000 }
        );
      } catch (err: any) {
        console.error("Transaction failed:", err);
        await prisma.importBatch.create({
          data: {
            fileName: path.basename(filePath),
            rowsRead,
            rowsCreated,
            rowsUpdated,
            rowsSkipped,
            rowsFlagged,
            errors: { message: err.message, stack: err.stack },
          },
        });
        process.exit(1);
      }
    }
  }

  // Print Summary Table
  console.log(`==================================================`);
  console.log(`Import Summary: ${path.basename(filePath)} (${type.toUpperCase()})`);
  console.log(`--------------------------------------------------`);
  console.log(`Rows Read:     ${rowsRead}`);
  console.log(`Rows Created:  ${rowsCreated}`);
  console.log(`Rows Updated:  ${rowsUpdated}`);
  console.log(`Rows Skipped:  ${rowsSkipped}`);
  console.log(`Rows Flagged:  ${rowsFlagged}`);
  console.log(`Mode:          ${commit ? "COMMIT" : "DRY RUN"}`);
  console.log(`==================================================\n`);

  if (commit) {
    console.log("Running Acceptance Criteria Checks (§6)...");

    if (type === "patients") {
      const batchPatients = await prisma.patient.findMany({
        where: { importBatch: { fileName: path.basename(filePath) } },
      });

      const totalBatch = batchPatients.length;
      const activeCount = batchPatients.filter((p) => p.importStatus === ImportStatus.ACTIVE).length;
      const reviewCount = batchPatients.filter((p) => p.importStatus === ImportStatus.NEEDS_REVIEW).length;
      const patientTypeCount = batchPatients.filter((p) => p.entryType === PatientEntryType.PATIENT).length;
      const linkedTypeCount = batchPatients.filter((p) => p.entryType === PatientEntryType.LINKED_CONTACT).length;
      const altPhoneCount = batchPatients.filter((p) => Boolean(p.phoneAlt && p.phoneAlt.trim())).length;
      const missingRawCount = batchPatients.filter((p) => !p.rawContactName).length;

      console.log(`- Batch Patients Count: ${totalBatch} (Expected: 646)`);
      console.log(`- ACTIVE: ${activeCount} (Expected: 521)`);
      console.log(`- NEEDS_REVIEW: ${reviewCount} (Expected: 125)`);
      console.log(`- PATIENT: ${patientTypeCount} (Expected: 598)`);
      console.log(`- LINKED_CONTACT: ${linkedTypeCount} (Expected: 48)`);
      console.log(`- phoneAlt Populated: ${altPhoneCount} (Expected: 19)`);
      console.log(`- Missing rawContactName: ${missingRawCount} (Expected: 0)`);

      const passed =
        totalBatch === 646 &&
        activeCount === 521 &&
        reviewCount === 125 &&
        patientTypeCount === 598 &&
        linkedTypeCount === 48 &&
        altPhoneCount === 19 &&
        missingRawCount === 0;

      if (!passed) {
        console.error("\n❌ Acceptance criteria checks FAILED for patients!");
        process.exit(1);
      }
      console.log("\n✅ All Patient Acceptance Criteria Passed!");
    } else if (type === "referrals") {
      const allReferrals = await prisma.referralContact.findMany();

      const totalReferrals = allReferrals.length;
      const docCount = allReferrals.filter((r) => r.category === ReferralCategory.DOCTOR).length;
      const physioCount = allReferrals.filter((r) => r.category === ReferralCategory.PHYSIOTHERAPIST).length;
      const facilityCount = allReferrals.filter((r) => r.category === ReferralCategory.FACILITY).length;
      const vendorCount = allReferrals.filter((r) => r.category === ReferralCategory.VENDOR).length;
      const activeCount = allReferrals.filter((r) => r.importStatus === ImportStatus.ACTIVE).length;
      const reviewCount = allReferrals.filter((r) => r.importStatus === ImportStatus.NEEDS_REVIEW).length;
      const nullPhoneCount = allReferrals.filter((r) => !r.phone).length;

      console.log(`- Total Referral Contacts: ${totalReferrals} (Expected: 216)`);
      console.log(`- DOCTOR: ${docCount} (Expected: 116)`);
      console.log(`- PHYSIOTHERAPIST: ${physioCount} (Expected: 60)`);
      console.log(`- FACILITY: ${facilityCount} (Expected: 29)`);
      console.log(`- VENDOR: ${vendorCount} (Expected: 11)`);
      console.log(`- ACTIVE: ${activeCount} (Expected: 169)`);
      console.log(`- NEEDS_REVIEW: ${reviewCount} (Expected: 47)`);
      console.log(`- Null Phone Count: ${nullPhoneCount} (Expected: 1)`);

      const passed =
        totalReferrals === 216 &&
        docCount === 116 &&
        physioCount === 60 &&
        facilityCount === 29 &&
        vendorCount === 11 &&
        activeCount === 169 &&
        reviewCount === 47 &&
        nullPhoneCount === 1;

      if (!passed) {
        console.error("\n❌ Acceptance criteria checks FAILED for referrals!");
        process.exit(1);
      }
      console.log("\n✅ All Referral Acceptance Criteria Passed!");
    }
  }
}

main()
  .catch((err) => {
    console.error("Importer execution error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
