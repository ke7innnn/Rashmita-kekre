-- AlterTable Patient
ALTER TABLE "Patient" ALTER COLUMN "dateOfBirth" DROP NOT NULL;
ALTER TABLE "Patient" ALTER COLUMN "gender" DROP NOT NULL;

-- Remove fake default DOB and unspecified gender for imported contacts
UPDATE "Patient" 
SET "dateOfBirth" = NULL 
WHERE "dateOfBirth" = '1990-01-01'::timestamp 
   OR "dateOfBirth" = '1989-12-31 18:30:00'::timestamp;

UPDATE "Patient" 
SET "gender" = NULL 
WHERE "gender" = 'Unspecified';
