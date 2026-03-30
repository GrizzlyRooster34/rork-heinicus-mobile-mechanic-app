ALTER TABLE "Job" ADD COLUMN "signatureUrl" TEXT;
ALTER TABLE "Job" ADD COLUMN "signatureCapturedAt" TIMESTAMP(3);
ALTER TABLE "Job" ADD COLUMN "signatureCapturedBy" TEXT;
