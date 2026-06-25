ALTER TYPE "ProcessingJobStatus" ADD VALUE IF NOT EXISTS 'cancelled';

CREATE TYPE "MissingProductRequestStatus" AS ENUM (
  'requested',
  'reviewing',
  'converted',
  'rejected'
);

ALTER TABLE "ProcessingJob"
ADD COLUMN "reviewedAt" TIMESTAMP(3),
ADD COLUMN "reviewedByUserId" UUID,
ADD COLUMN "cancelledAt" TIMESTAMP(3),
ADD COLUMN "cancelledByUserId" UUID,
ADD COLUMN "cancellationReason" TEXT;

CREATE TABLE "MissingProductRequest" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "requestedName" TEXT NOT NULL,
  "categoryHint" TEXT,
  "packageHint" TEXT,
  "notes" TEXT,
  "status" "MissingProductRequestStatus" NOT NULL DEFAULT 'requested',
  "catalogProductId" UUID,
  "reviewedByUserId" UUID,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MissingProductRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MissingProductRequest_status_createdAt_idx"
ON "MissingProductRequest"("status", "createdAt");

CREATE INDEX "MissingProductRequest_userId_createdAt_idx"
ON "MissingProductRequest"("userId", "createdAt");

ALTER TABLE "MissingProductRequest"
ADD CONSTRAINT "MissingProductRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MissingProductRequest"
ADD CONSTRAINT "MissingProductRequest_catalogProductId_fkey"
FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
