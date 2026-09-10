# Build brief — contact backfill (patients + referral network)

**Target repo:** Health 360 CRM (Next.js 14, TypeScript, Prisma, PostgreSQL, NextAuth, Tailwind)
**Type:** one-time data backfill with a re-runnable importer and an admin review queue
**Suggested path for this file:** `docs/imports/contact-backfill.md`

---

## 0. Read this before writing any code

1. **Inspect the existing Prisma schema first.** A `Patient` model already exists. Do not
   create a second one, do not rename fields, and do not alter existing relations
   (appointments, treatment plans, SOAP notes, invoices). Extend it additively.
2. **These files contain contact records only.** Names and phone numbers, nothing clinical.
   Do not create appointments, treatment plans, assessments, invoices or SOAP notes as a
   side effect of the import.
3. **Not every row is safe to import live.** Rows flagged `needs_review = yes` must land in
   the database but stay out of the active patient list until a human approves them.
4. **The importer must be idempotent.** Running it twice must not create duplicates.
5. If anything in this brief contradicts what is already in the repo, stop and report the
   conflict rather than guessing.

---

## 1. Input files

Place both CSVs at `data/imports/` and commit them (they are small, and the review queue
needs the raw values for comparison).

| File | Rows | Contents |
|---|---|---|
| `health360_patients_import.csv` | 646 | Patients, extracted from contacts tagged `Pt` |
| `health360_doctors_referrals_import.csv` | 216 | Referring doctors, physios, facilities, suppliers |

Both are UTF-8, comma-delimited, with a header row. Names may contain apostrophes and
non-ASCII characters — do not transliterate or strip them.

### 1a. `health360_patients_import.csv` columns

| Column | Type | Notes |
|---|---|---|
| `name` | string | Cleaned name, `Pt` tag removed. **2 rows are empty** — the source contact had no name. |
| `phone_e164` | string | `+91XXXXXXXXXX`. Populated on all 646 rows. 2 rows are not `+91` (see §5). |
| `phone_10digit` | string | National form, blank where the number is foreign or malformed. |
| `phone_alt` | string | Comma-separated additional numbers. Populated on 19 rows. |
| `entry_type` | enum | `patient` (598) or `linked_contact` (48). See §5. |
| `relation_note` | string | `son`, `daughter`, `wife`, `husband`, `dil`, `mom`, `father` — blank if none. |
| `org` | string | From the vCard ORG field. Almost always blank. |
| `raw_contact_name` | string | Original contact name, verbatim. Never overwrite this. |
| `raw_phone` | string | Original number string, verbatim. |
| `needs_review` | `yes`/`no` | 125 are `yes`. |
| `review_reason` | string | Semicolon-separated reasons. |

### 1b. `health360_doctors_referrals_import.csv` columns

Same columns, except `entry_type` and `relation_note` are replaced by:

| Column | Type | Notes |
|---|---|---|
| `category` | enum | `doctor` (116), `physiotherapist` (60), `facility` (29), `vendor` (11) |
| `specialty` | string | Blank on 108 rows — only filled where the contact name stated it. Do not infer. |
| `location` | string | Locality parsed from the contact name (Mulund, Thane, Virar, Naigaon…). Often blank. |

47 rows are `needs_review = yes`. One row has no phone number at all.

---

## 2. Schema changes

Write one migration, named `add_contact_import_backfill`.

### 2a. Extend `Patient`

Add these fields only if they are not already present. All must be optional or defaulted so
the migration does not break existing rows.

```prisma
enum ImportStatus {
  ACTIVE
  NEEDS_REVIEW
  REJECTED
}

enum PatientEntryType {
  PATIENT
  LINKED_CONTACT
}

// on model Patient
phoneAlt        String?
entryType       PatientEntryType @default(PATIENT)
relationNote    String?
importStatus    ImportStatus     @default(ACTIVE)
importReason    String?
rawContactName  String?
rawPhone        String?
importBatchId   String?
importBatch     ImportBatch?     @relation(fields: [importBatchId], references: [id])
```

If `Patient.phone` is not already unique, add `@unique` to it — the importer keys on it.
If existing rows would violate that constraint, stop and report rather than deleting anything.

### 2b. New model `ReferralContact`

```prisma
enum ReferralCategory {
  DOCTOR
  PHYSIOTHERAPIST
  FACILITY
  VENDOR
}

model ReferralContact {
  id             String           @id @default(cuid())
  name           String
  phone          String?          @unique
  phoneAlt       String?
  category       ReferralCategory
  specialty      String?
  location       String?
  organisation   String?
  isActive       Boolean          @default(true)
  importStatus   ImportStatus     @default(ACTIVE)
  importReason   String?
  rawContactName String?
  rawPhone       String?
  importBatchId  String?
  importBatch    ImportBatch?     @relation(fields: [importBatchId], references: [id])
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}
```

`phone` is nullable because one row has no number, and unique because it is the dedupe key.

### 2c. New model `ImportBatch`

```prisma
model ImportBatch {
  id           String            @id @default(cuid())
  fileName     String
  rowsRead     Int
  rowsCreated  Int
  rowsUpdated  Int
  rowsSkipped  Int
  rowsFlagged  Int
  errors       Json?
  runAt        DateTime          @default(now())
  patients     Patient[]
  referrals    ReferralContact[]
}
```

### 2d. Referral link on `Patient` — do **not** build this yet

Do not add a `referredById` relation in this pass. The CSVs carry no referral attribution,
so the field would ship empty and invite guessing. Note it as a follow-up instead.

---

## 3. Importer script

Create `scripts/import-contacts.ts`, runnable with `tsx`. Add an npm script
`"import:contacts": "tsx scripts/import-contacts.ts"`.

**Flags**

- `--file=<path>` — required
- `--type=patients|referrals` — required
- `--dry-run` — default behaviour; parses, validates, prints the summary, writes nothing
- `--commit` — performs the writes

Refuse to write unless `--commit` is passed explicitly.

**Parsing**

- Use `csv-parse/sync` with `columns: true`, `bom: true`, `trim: false`.
- Do not trim `name` beyond leading/trailing whitespace; internal spacing is intentional.
- Treat an empty string as `null` for every optional field.

**Validation, per row**

- Indian mobile: `/^\+91[6-9]\d{9}$/`. A row failing this is imported with
  `importStatus = NEEDS_REVIEW` and a reason appended — never dropped, never auto-corrected.
- A foreign number (`+1…`) is valid. Do not rewrite it to `+91`.
- A blank `name` forces `NEEDS_REVIEW`.

**Mapping**

- `needs_review = yes` → `importStatus = NEEDS_REVIEW`, `importReason = review_reason`.
- `needs_review = no` → `importStatus = ACTIVE`.
- `entry_type` / `category` uppercase into the enums above.
- `phone_alt` stores verbatim as a string. Do not split it into separate records.
- `raw_contact_name` and `raw_phone` map straight across, always.

**Write strategy**

- Upsert on `phone`. If `phone` is null, upsert on `rawContactName`.
- On conflict, update the record but **never overwrite a field a human has edited** — if
  `updatedAt > importBatch.runAt` of the previous batch, skip the row and count it as
  skipped.
- Wrap the whole file in a single transaction. On any error, roll back and write the
  `ImportBatch` row with the error payload so the failure is visible.

**Output**

Print a summary table (rows read / created / updated / skipped / flagged) and persist the
same numbers to `ImportBatch`. Exit non-zero if the counts do not match §6.

---

## 4. Admin review queue

New page at `/admin/imports/review`, ADMIN role only — enforce through the existing
NextAuth middleware, not a client-side check.

- Two tabs: Patients and Referral contacts.
- List every record with `importStatus = NEEDS_REVIEW`, showing `name`, `phone`,
  `importReason`, and `rawContactName` side by side so the reviewer can see what was cleaned.
- Row actions: **Approve** (sets `ACTIVE`), **Edit** (name and phone inline, then approve),
  **Merge into…** (search existing records by name or phone, move any relations, soft-delete
  the loser), **Reject** (sets `REJECTED`, keeps the row).
- Filter by reason, so the 48 `LINKED_CONTACT` rows and the 20 duplicate-name rows can be
  worked through as batches.
- Follow the existing Aurora dark-luxe system — Clash Display for headings, Satoshi for body,
  IBM Plex Mono for phone numbers. Reuse existing table and dialog components rather than new ones.

**Everywhere else in the app**, exclude `NEEDS_REVIEW` and `REJECTED` from patient lists,
search, appointment booking and analytics. Add the filter at the query layer so it cannot be
forgotten in a new view.

---

## 5. Known data hazards

These are real cases in the files. Handle each explicitly.

1. **48 `linked_contact` rows.** The name reads like `Amrita Kishor Naiks Daughter` — the
   phone belongs to the relative, and the patient may be the second name. Surface an
   "unverified contact" badge in the UI and block appointment booking against these until a
   human resolves them.
2. **20 duplicate names with different numbers** (two `Aarti Pawar`, two `Gautam Kapoor`).
   Both rows import. The merge action in the review queue is what resolves them.
3. **2 patient rows with no name.** Import with phone only, `NEEDS_REVIEW`.
4. **1 Canadian number** (`+1416…`). Valid. Must not be normalised to `+91`, and the WATI
   and VAPI integrations must skip or route it separately rather than failing the batch.
5. **1 malformed patient number** — 11 digits with no country code. Imports as
   `NEEDS_REVIEW`, unedited.
6. **4 referral landlines** in `+91` with non-mobile digit counts. Valid records; they will
   fail mobile validation, so exempt `ReferralContact` from the mobile-only regex.
7. **2 rows are the clinic's own records** (Dr. Rashmita's card, the Health360 clinic card).
   They are flagged in `review_reason`. Do not import them as referrers — either skip them or
   reject them in review.
8. **Zero phone-number overlap between the two files** — verified before handoff. If the
   importer finds a collision, that means a file changed; stop and report.

---

## 6. Acceptance criteria

The import passes when all of the following hold.

**Patients**
- 646 rows read, 646 `Patient` records exist with `importBatchId` set
- 521 are `ACTIVE`, 125 are `NEEDS_REVIEW`
- 598 are `entryType = PATIENT`, 48 are `LINKED_CONTACT`
- 19 have a non-null `phoneAlt`
- every record has a non-null `rawContactName`

**Referrals**
- 216 rows read, 216 `ReferralContact` records
- 116 `DOCTOR`, 60 `PHYSIOTHERAPIST`, 29 `FACILITY`, 11 `VENDOR`
- 169 `ACTIVE`, 47 `NEEDS_REVIEW`
- exactly 1 record with a null phone

**Behaviour**
- Re-running with `--commit` creates 0 new records
- `--dry-run` writes nothing — verify with a row count before and after
- The patient list, patient search and appointment booking return 521 patients, not 646
- A non-ADMIN session gets 403 on `/admin/imports/review`
- `pnpm build` and the type-check pass with no new errors

---

## 7. Out of scope

Do not build in this pass: referral attribution on patients, bulk WhatsApp or VAPI outreach
to imported numbers, deduplication across patients and referrals, or any backfill of
appointment history. Flag them as follow-ups and stop.
