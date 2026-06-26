-- CreateEnum
CREATE TYPE "PublicSearchStrategy" AS ENUM ('candidate', 'broad_fallback');

-- CreateEnum
CREATE TYPE "PublicSearchSloAlertStatus" AS ENUM ('active', 'resolved');

-- CreateTable
CREATE TABLE "PublicSearchMetric" (
    "id" UUID NOT NULL,
    "regionSlug" TEXT NOT NULL,
    "strategy" "PublicSearchStrategy" NOT NULL,
    "durationMs" DECIMAL(10,2) NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "candidateOfferCount" INTEGER NOT NULL,
    "candidateProductCount" INTEGER NOT NULL,
    "candidateVariantCount" INTEGER NOT NULL,
    "candidateEstablishmentCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicSearchMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicSearchSloAlert" (
    "id" UUID NOT NULL,
    "status" "PublicSearchSloAlertStatus" NOT NULL DEFAULT 'active',
    "sampleCount" INTEGER NOT NULL,
    "observedP95Ms" DECIMAL(10,2) NOT NULL,
    "targetP95Ms" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastNotifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "PublicSearchSloAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicSearchMetric_createdAt_idx" ON "PublicSearchMetric"("createdAt");

-- CreateIndex
CREATE INDEX "PublicSearchMetric_strategy_createdAt_idx" ON "PublicSearchMetric"("strategy", "createdAt");

-- CreateIndex
CREATE INDEX "PublicSearchMetric_regionSlug_createdAt_idx" ON "PublicSearchMetric"("regionSlug", "createdAt");

-- CreateIndex
CREATE INDEX "PublicSearchSloAlert_status_triggeredAt_idx" ON "PublicSearchSloAlert"("status", "triggeredAt");
