import 'dotenv/config';
import { prisma } from '../src/lib/db';

export function cleanDoctorNameAndMeta(
  rawName: string,
  rawSpecialty?: string | null,
  rawOrg?: string | null,
  rawLoc?: string | null
) {
  let name = (rawName || '').trim();
  let specialty = (rawSpecialty || '').trim() || 'General Practice';
  let clinic = (rawOrg || '').trim() || (rawLoc || '').trim() || 'Clinic';

  // Standardize Dr. prefix
  if (!/^Dr\./i.test(name)) {
    if (/^Dr\s+/i.test(name)) {
      name = 'Dr. ' + name.slice(3).trim();
    } else if (/^Dr/i.test(name)) {
      name = 'Dr. ' + name.slice(2).trim();
    } else {
      name = 'Dr. ' + name;
    }
  } else {
    name = 'Dr. ' + name.replace(/^Dr\.\s*/i, '').trim();
  }

  // Extract embedded clinical tags & hospital names
  if (/ Chiropractor/i.test(name)) {
    specialty = 'Chiropractic';
    name = name.replace(/ Chiropractor/i, '');
  }
  if (/ Homeopath/i.test(name)) {
    specialty = 'Homeopathy';
    name = name.replace(/ Homeopath/i, '');
  }
  if (/ Gynecologist/i.test(name)) {
    specialty = 'Gynaecology';
    name = name.replace(/ Gynecologist/i, '');
  }
  if (/ Ortho/i.test(name)) {
    specialty = 'Orthopaedics';
    name = name.replace(/ Ortho/i, '');
  }
  if (/ Pediatrician/i.test(name)) {
    specialty = 'Paediatrics';
    name = name.replace(/ Pediatrician/i, '');
  }
  if (/ Psychiatrist/i.test(name)) {
    specialty = 'Psychiatry';
    name = name.replace(/ Psychiatrist/i, '');
  }
  if (/ Pelvic Floor PT/i.test(name)) {
    specialty = 'Pelvic Floor Physiotherapy';
    name = name.replace(/ Pelvic Floor PT/i, '');
  }
  if (/ \(PT\)| PT| \(pt\)| pt/i.test(name)) {
    specialty = 'Physiotherapy';
    name = name.replace(/ \(PT\)| PT| \(pt\)| pt/i, '');
  }
  if (/ GP/i.test(name)) {
    if (specialty === 'General practice' || specialty === 'General Practice') {
      specialty = 'General Practice';
    }
    name = name.replace(/ GP/i, '');
  }
  if (/ TMV/i.test(name)) {
    clinic = clinic === 'Clinic' ? 'TMV' : `${clinic} (TMV)`;
    name = name.replace(/ TMV/i, '');
  }
  if (/ Sir/i.test(name)) {
    name = name.replace(/ Sir/i, '');
  }
  if (/ Krishna Hospital/i.test(name)) {
    clinic = 'Krishna Hospital';
    name = name.replace(/ Krishna Hospital/i, '');
  }

  // Proper Title Case for doctor name (after Dr.)
  const rawParts = name.replace(/^Dr\.\s*/, '').trim().split(/\s+/);
  const titleCasedParts = rawParts.map((p) => {
    if (p.startsWith('(') && p.endsWith(')')) return p;
    if (p.length === 0) return '';
    // Preserve Roman numerals / initials
    if (p.length === 1) return p.toUpperCase() + '.';
    return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
  }).filter(Boolean);

  const finalName = 'Dr. ' + titleCasedParts.join(' ');

  return {
    name: finalName,
    specialty,
    clinic,
  };
}

async function main() {
  console.log('--- SYNCING DOCTORS INTO REFERRING DOCTOR TABLE ---');

  // 1. Fetch existing ReferringDoctors
  const existingDocs = await prisma.referringDoctor.findMany();
  const existingByNameLower = new Map<string, typeof existingDocs[0]>();
  const existingByPhone = new Map<string, typeof existingDocs[0]>();

  existingDocs.forEach((d) => {
    existingByNameLower.set(d.name.toLowerCase().trim(), d);
    if (d.phone) {
      existingByPhone.set(d.phone.replace(/\D/g, '').slice(-10), d);
    }
  });

  console.log(`Found ${existingDocs.length} already registered referring doctors.`);

  // 2. Fetch all Doctor candidates from ReferralContact table
  const referralContacts = await prisma.referralContact.findMany({
    where: {
      OR: [
        { category: 'DOCTOR' },
        { name: { startsWith: 'Dr' } },
        { name: { startsWith: 'dr' } },
        { name: { startsWith: 'DR' } },
      ],
    },
    orderBy: { name: 'asc' },
  });

  console.log(`Found ${referralContacts.length} doctor records in ReferralContact.`);

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const c of referralContacts) {
    const { name, specialty, clinic } = cleanDoctorNameAndMeta(
      c.name,
      c.specialty,
      c.organisation,
      c.location
    );

    const cleanPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : null;
    const cleanPhoneAlt = c.phoneAlt ? c.phoneAlt.replace(/\D/g, '').slice(-10) : null;
    const phoneToUse = cleanPhone || cleanPhoneAlt;

    const nameKey = name.toLowerCase().trim();

    // Check if doctor exists by name
    const existingByName = existingByNameLower.get(nameKey);
    // Check if doctor exists by phone
    const existingByP = phoneToUse ? existingByPhone.get(phoneToUse) : undefined;

    const matchedExisting = existingByName || existingByP;

    if (matchedExisting) {
      // Enrich existing record if phone or clinic is missing
      const needsUpdate =
        (!matchedExisting.phone && phoneToUse) ||
        (matchedExisting.clinic === 'Clinic' && clinic !== 'Clinic') ||
        (matchedExisting.specialty === 'General Practice' && specialty !== 'General Practice');

      if (needsUpdate) {
        await prisma.referringDoctor.update({
          where: { id: matchedExisting.id },
          data: {
            ...(phoneToUse && !matchedExisting.phone ? { phone: phoneToUse } : {}),
            ...(clinic !== 'Clinic' && matchedExisting.clinic === 'Clinic' ? { clinic } : {}),
            ...(specialty !== 'General Practice' && matchedExisting.specialty === 'General Practice' ? { specialty } : {}),
          },
        });
        updatedCount++;
      } else {
        skippedCount++;
      }
    } else {
      // Create new ReferringDoctor
      try {
        const created = await prisma.referringDoctor.create({
          data: {
            name,
            specialty,
            clinic: clinic || 'Clinic',
            phone: phoneToUse,
            email: null,
          },
        });
        existingByNameLower.set(nameKey, created);
        if (phoneToUse) existingByPhone.set(phoneToUse, created);
        createdCount++;
      } catch (err: any) {
        console.warn(`Failed to create doctor ${name}:`, err.message);
      }
    }
  }

  console.log(`\nSync Summary:`);
  console.log(`- Created new referring doctors: ${createdCount}`);
  console.log(`- Updated existing referring doctors: ${updatedCount}`);
  console.log(`- Already up to date: ${skippedCount}`);

  // 3. Connect existing patients with referringDoctor to normalized doctor names
  console.log('\n--- NORMALIZING PATIENT REFERRAL LINKS ---');
  const allPatients = await prisma.patient.findMany({
    where: {
      referringDoctor: { not: null },
    },
    select: { id: true, fullName: true, referringDoctor: true },
  });

  const allRefDocs = await prisma.referringDoctor.findMany();
  let patientsUpdated = 0;

  for (const p of allPatients) {
    const raw = (p.referringDoctor || '').trim();
    if (!raw) continue;
    const rawLower = raw.toLowerCase();

    // Skip self/direct
    if (['self', 'direct', 'self / direct', 'self/direct', 'self-direct', 'n/a', 'na', 'none'].includes(rawLower)) {
      continue;
    }

    // Match against ReferringDoctor
    const matched = allRefDocs.find(
      (d) =>
        d.name.toLowerCase().trim() === rawLower ||
        d.name.toLowerCase().replace(/[^a-z]/g, '') === rawLower.replace(/[^a-z]/g, '') ||
        (rawLower.length > 5 && d.name.toLowerCase().includes(rawLower)) ||
        (rawLower.length > 5 && rawLower.includes(d.name.toLowerCase().replace(/^dr\.\s*/, '')))
    );

    if (matched && matched.name !== raw) {
      await prisma.patient.update({
        where: { id: p.id },
        data: { referringDoctor: matched.name },
      });
      console.log(`Updated Patient "${p.fullName}": "${raw}" -> "${matched.name}"`);
      patientsUpdated++;
    }
  }

  console.log(`\nNormalized ${patientsUpdated} patient referral links.`);

  const finalTotalDocs = await prisma.referringDoctor.count();
  console.log(`Total active doctors in Referral Network now: ${finalTotalDocs}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
