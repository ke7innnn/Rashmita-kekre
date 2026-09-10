-- Migration: add_contact_import_backfill

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ImportStatus" AS ENUM ('ACTIVE', 'NEEDS_REVIEW', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PatientEntryType" AS ENUM ('PATIENT', 'LINKED_CONTACT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ReferralCategory" AS ENUM ('DOCTOR', 'PHYSIOTHERAPIST', 'FACILITY', 'VENDOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable Patient
ALTER TABLE "Patient" 
  ALTER COLUMN "phone" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "entryType" "PatientEntryType" NOT NULL DEFAULT 'PATIENT',
  ADD COLUMN IF NOT EXISTS "importBatchId" TEXT,
  ADD COLUMN IF NOT EXISTS "importReason" TEXT,
  ADD COLUMN IF NOT EXISTS "importStatus" "ImportStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "mergedIntoId" TEXT,
  ADD COLUMN IF NOT EXISTS "phoneAlt" TEXT,
  ADD COLUMN IF NOT EXISTS "rawContactName" TEXT,
  ADD COLUMN IF NOT EXISTS "rawPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "relationNote" TEXT;

-- CreateTable ReferralContact
CREATE TABLE IF NOT EXISTS "ReferralContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "phoneAlt" TEXT,
    "category" "ReferralCategory" NOT NULL,
    "specialty" TEXT,
    "location" TEXT,
    "organisation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "importStatus" "ImportStatus" NOT NULL DEFAULT 'ACTIVE',
    "importReason" TEXT,
    "rawContactName" TEXT,
    "rawPhone" TEXT,
    "importBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable ImportBatch
CREATE TABLE IF NOT EXISTS "ImportBatch" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowsRead" INTEGER NOT NULL,
    "rowsCreated" INTEGER NOT NULL,
    "rowsUpdated" INTEGER NOT NULL,
    "rowsSkipped" INTEGER NOT NULL,
    "rowsFlagged" INTEGER NOT NULL,
    "errors" JSONB,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ReferralContact_phone_key" ON "ReferralContact"("phone");
CREATE UNIQUE INDEX IF NOT EXISTS "Patient_phone_key" ON "Patient"("phone");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Patient" ADD CONSTRAINT "Patient_mergedIntoId_fkey" FOREIGN KEY ("mergedIntoId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "ReferralContact" ADD CONSTRAINT "ReferralContact_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
