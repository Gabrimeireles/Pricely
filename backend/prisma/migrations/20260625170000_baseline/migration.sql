-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "RegionStatus" AS ENUM ('active', 'activating', 'inactive');

-- CreateEnum
CREATE TYPE "OfferAvailabilityStatus" AS ENUM ('available', 'unavailable', 'uncertain');

-- CreateEnum
CREATE TYPE "OfferConfidenceLevel" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "ProductAliasSourceType" AS ENUM ('rule', 'admin', 'receipt');

-- CreateEnum
CREATE TYPE "ShoppingListStatus" AS ENUM ('draft', 'ready', 'archived');

-- CreateEnum
CREATE TYPE "ShoppingListItemResolutionStatus" AS ENUM ('unresolved', 'matched', 'partial', 'missing');

-- CreateEnum
CREATE TYPE "ShoppingListItemBrandPreferenceMode" AS ENUM ('any', 'preferred', 'exact');

-- CreateEnum
CREATE TYPE "ShoppingListItemPurchaseStatus" AS ENUM ('pending', 'purchased');

-- CreateEnum
CREATE TYPE "OptimizationMode" AS ENUM ('local', 'global_unique', 'global_full', 'local_unique', 'local_multi', 'global_multi');

-- CreateEnum
CREATE TYPE "OptimizationRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "OptimizationCoverageStatus" AS ENUM ('complete', 'partial', 'none');

-- CreateEnum
CREATE TYPE "OptimizationSelectionStatus" AS ENUM ('selected', 'review', 'missing');

-- CreateEnum
CREATE TYPE "UserEntitlementPlan" AS ENUM ('free', 'premium');

-- CreateEnum
CREATE TYPE "UserEntitlementStatus" AS ENUM ('active', 'trialing', 'past_due', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "OptimizationTokenLedgerAction" AS ENUM ('grant', 'consume', 'refund', 'expire', 'admin_adjustment', 'receipt_bonus');

-- CreateEnum
CREATE TYPE "ProcessingJobType" AS ENUM ('optimization', 'receipt_processing');

-- CreateEnum
CREATE TYPE "ProcessingJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed', 'retrying');

-- CreateEnum
CREATE TYPE "ReceiptSourceType" AS ENUM ('manual_entry', 'qr_code_url', 'qr_code_image', 'pdf_upload', 'image_parse', 'structured_provider');

-- CreateEnum
CREATE TYPE "ReceiptParseStatus" AS ENUM ('queued', 'parsed', 'partial', 'failed');

-- CreateEnum
CREATE TYPE "ReceiptContributionTrustLevel" AS ENUM ('untrusted', 'pending_review', 'trusted', 'rejected');

-- CreateEnum
CREATE TYPE "ReceiptModerationStatus" AS ENUM ('pending', 'accepted', 'quarantined', 'duplicate', 'rejected');

-- CreateEnum
CREATE TYPE "ReceiptRewardEligibilityStatus" AS ENUM ('disabled', 'ineligible', 'eligible_pending', 'granted');

-- CreateEnum
CREATE TYPE "CityInclusionRequestStatus" AS ENUM ('requested', 'reviewed', 'planned', 'rejected');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "preferredRegionId" UUID,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateCode" VARCHAR(2) NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL DEFAULT 'BR',
    "implantationStatus" "RegionStatus" NOT NULL DEFAULT 'activating',
    "publicSortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityInclusionRequest" (
    "id" UUID NOT NULL,
    "cityName" TEXT NOT NULL,
    "stateCode" VARCHAR(2) NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "message" TEXT,
    "status" "CityInclusionRequestStatus" NOT NULL DEFAULT 'requested',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CityInclusionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" UUID NOT NULL,
    "brandName" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cityName" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "addressLine" TEXT,
    "postalCode" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "locationSource" TEXT,
    "regionId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLocationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "regionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "postalCode" TEXT,
    "coverageRadiusKm" DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    "activeEstablishmentCount" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "locationSource" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLocationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "defaultUnit" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogProductAlias" (
    "id" UUID NOT NULL,
    "catalogProductId" UUID NOT NULL,
    "alias" TEXT NOT NULL,
    "sourceType" "ProductAliasSourceType" NOT NULL,
    "confidenceScore" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogProductAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL,
    "catalogProductId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "brandName" TEXT,
    "variantLabel" TEXT,
    "packageLabel" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" UUID NOT NULL,
    "catalogProductId" UUID NOT NULL,
    "productVariantId" UUID NOT NULL,
    "establishmentId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "packageLabel" TEXT NOT NULL,
    "priceAmount" DECIMAL(10,2) NOT NULL,
    "basePriceAmount" DECIMAL(10,2),
    "promotionalPriceAmount" DECIMAL(10,2),
    "currencyCode" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "availabilityStatus" "OfferAvailabilityStatus" NOT NULL,
    "confidenceLevel" "OfferConfidenceLevel" NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "receiptRecordId" UUID,
    "receiptLineItemId" UUID,
    "moderationStatus" "ReceiptModerationStatus",
    "contributionConfidence" DECIMAL(5,2),
    "observedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingList" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "preferredRegionId" UUID,
    "status" "ShoppingListStatus" NOT NULL DEFAULT 'draft',
    "shareToken" TEXT,
    "sharedAt" TIMESTAMP(3),
    "shareRevokedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "paidTotal" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShoppingListItem" (
    "id" UUID NOT NULL,
    "shoppingListId" UUID NOT NULL,
    "catalogProductId" UUID,
    "lockedProductVariantId" UUID,
    "optimizedProductVariantId" UUID,
    "optimizedFromBrandPreferenceMode" "ShoppingListItemBrandPreferenceMode",
    "optimizedAt" TIMESTAMP(3),
    "brandPreferenceMode" "ShoppingListItemBrandPreferenceMode" NOT NULL DEFAULT 'any',
    "preferredBrandNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requestedName" TEXT NOT NULL,
    "quantity" DECIMAL(10,2),
    "unitLabel" TEXT,
    "notes" TEXT,
    "purchaseStatus" "ShoppingListItemPurchaseStatus" NOT NULL DEFAULT 'pending',
    "purchasedAt" TIMESTAMP(3),
    "resolutionStatus" "ShoppingListItemResolutionStatus" NOT NULL DEFAULT 'unresolved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingListItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceMismatchReport" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shoppingListId" UUID NOT NULL,
    "shoppingListItemId" UUID,
    "expectedPrice" DECIMAL(10,2),
    "reportedPrice" DECIMAL(10,2),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceMismatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationRun" (
    "id" UUID NOT NULL,
    "shoppingListId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mode" "OptimizationMode" NOT NULL,
    "regionId" UUID NOT NULL,
    "userLocationPreferenceId" UUID,
    "coverageRadiusKm" DECIMAL(5,2),
    "candidateEstablishmentCount" INTEGER,
    "preferredEstablishmentId" UUID,
    "jobId" UUID,
    "status" "OptimizationRunStatus" NOT NULL DEFAULT 'queued',
    "totalEstimatedCost" DECIMAL(10,2),
    "estimatedSavings" DECIMAL(10,2),
    "coverageStatus" "OptimizationCoverageStatus" NOT NULL DEFAULT 'none',
    "summary" TEXT,
    "explanationPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OptimizationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntitlement" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "plan" "UserEntitlementPlan" NOT NULL,
    "status" "UserEntitlementStatus" NOT NULL,
    "source" TEXT NOT NULL,
    "externalRef" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEntitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationTokenLedgerEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" "OptimizationTokenLedgerAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "relatedOptimizationRunId" UUID,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OptimizationTokenLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptimizationSelection" (
    "id" UUID NOT NULL,
    "optimizationRunId" UUID NOT NULL,
    "shoppingListItemId" UUID NOT NULL,
    "productOfferId" UUID,
    "distanceKm" DECIMAL(6,2),
    "status" "OptimizationSelectionStatus" NOT NULL,
    "estimatedCost" DECIMAL(10,2),
    "comparisonPriceAmount" DECIMAL(10,2),
    "regionalAveragePriceAmount" DECIMAL(10,2),
    "savingsVsComparison" DECIMAL(10,2),
    "confidenceNotice" TEXT,

    CONSTRAINT "OptimizationSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingJob" (
    "id" UUID NOT NULL,
    "queueName" TEXT NOT NULL,
    "jobType" "ProcessingJobType" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "ProcessingJobStatus" NOT NULL DEFAULT 'queued',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "ProcessingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptRecord" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "establishmentId" UUID,
    "sourceType" "ReceiptSourceType" NOT NULL,
    "parseStatus" "ReceiptParseStatus" NOT NULL DEFAULT 'queued',
    "storeName" TEXT,
    "storeCnpj" TEXT,
    "accessKey" TEXT,
    "sefazUrl" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "jobId" UUID,
    "rawReference" TEXT,
    "confidenceScore" DECIMAL(5,2),
    "duplicateKey" TEXT,
    "trustLevel" "ReceiptContributionTrustLevel" NOT NULL DEFAULT 'untrusted',
    "moderationStatus" "ReceiptModerationStatus" NOT NULL DEFAULT 'pending',
    "rewardEligibilityStatus" "ReceiptRewardEligibilityStatus" NOT NULL DEFAULT 'disabled',
    "reviewReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptLineItem" (
    "id" UUID NOT NULL,
    "receiptRecordId" UUID NOT NULL,
    "ean" TEXT,
    "rawProductName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "packageSize" TEXT,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "originalUnitPrice" DECIMAL(10,2),
    "promotionalUnitPrice" DECIMAL(10,2),
    "lineTotal" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'BRL',
    "matchConfidence" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceiptLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_email_key" ON "UserAccount"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_refreshTokenHash_key" ON "UserSession"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "UserSession_userId_revokedAt_idx" ON "UserSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Region_slug_key" ON "Region"("slug");

-- CreateIndex
CREATE INDEX "CityInclusionRequest_stateCode_cityName_idx" ON "CityInclusionRequest"("stateCode", "cityName");

-- CreateIndex
CREATE INDEX "CityInclusionRequest_status_createdAt_idx" ON "CityInclusionRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_cnpj_key" ON "Establishment"("cnpj");

-- CreateIndex
CREATE INDEX "Establishment_regionId_isActive_idx" ON "Establishment"("regionId", "isActive");

-- CreateIndex
CREATE INDEX "Establishment_regionId_isActive_unitName_idx" ON "Establishment"("regionId", "isActive", "unitName");

-- CreateIndex
CREATE INDEX "UserLocationPreference_userId_isDefault_idx" ON "UserLocationPreference"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "UserLocationPreference_regionId_idx" ON "UserLocationPreference"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_slug_key" ON "CatalogProduct"("slug");

-- CreateIndex
CREATE INDEX "CatalogProduct_category_isActive_idx" ON "CatalogProduct"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_name_category_defaultUnit_key" ON "CatalogProduct"("name", "category", "defaultUnit");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProductAlias_catalogProductId_alias_key" ON "CatalogProductAlias"("catalogProductId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_slug_key" ON "ProductVariant"("slug");

-- CreateIndex
CREATE INDEX "ProductVariant_catalogProductId_isActive_idx" ON "ProductVariant"("catalogProductId", "isActive");

-- CreateIndex
CREATE INDEX "ProductOffer_catalogProductId_isActive_observedAt_idx" ON "ProductOffer"("catalogProductId", "isActive", "observedAt");

-- CreateIndex
CREATE INDEX "ProductOffer_productVariantId_isActive_observedAt_idx" ON "ProductOffer"("productVariantId", "isActive", "observedAt");

-- CreateIndex
CREATE INDEX "ProductOffer_establishmentId_isActive_idx" ON "ProductOffer"("establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "ProductOffer_productVariantId_establishmentId_isActive_idx" ON "ProductOffer"("productVariantId", "establishmentId", "isActive");

-- CreateIndex
CREATE INDEX "ProductOffer_isActive_availabilityStatus_confidenceLevel_es_idx" ON "ProductOffer"("isActive", "availabilityStatus", "confidenceLevel", "establishmentId");

-- CreateIndex
CREATE INDEX "ProductOffer_receiptRecordId_idx" ON "ProductOffer"("receiptRecordId");

-- CreateIndex
CREATE INDEX "ProductOffer_moderationStatus_idx" ON "ProductOffer"("moderationStatus");

-- CreateIndex
CREATE INDEX "ShoppingList_userId_updatedAt_idx" ON "ShoppingList"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ShoppingList_shareToken_sharedAt_idx" ON "ShoppingList"("shareToken", "sharedAt");

-- CreateIndex
CREATE INDEX "ShoppingListItem_shoppingListId_idx" ON "ShoppingListItem"("shoppingListId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_catalogProductId_idx" ON "ShoppingListItem"("catalogProductId");

-- CreateIndex
CREATE INDEX "ShoppingListItem_lockedProductVariantId_idx" ON "ShoppingListItem"("lockedProductVariantId");

-- CreateIndex
CREATE INDEX "PriceMismatchReport_shoppingListId_createdAt_idx" ON "PriceMismatchReport"("shoppingListId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceMismatchReport_shoppingListItemId_idx" ON "PriceMismatchReport"("shoppingListItemId");

-- CreateIndex
CREATE INDEX "PriceMismatchReport_userId_createdAt_idx" ON "PriceMismatchReport"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizationRun_jobId_key" ON "OptimizationRun"("jobId");

-- CreateIndex
CREATE INDEX "OptimizationRun_shoppingListId_createdAt_idx" ON "OptimizationRun"("shoppingListId", "createdAt");

-- CreateIndex
CREATE INDEX "OptimizationRun_status_createdAt_idx" ON "OptimizationRun"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OptimizationRun_userLocationPreferenceId_idx" ON "OptimizationRun"("userLocationPreferenceId");

-- CreateIndex
CREATE INDEX "UserEntitlement_userId_plan_status_idx" ON "UserEntitlement"("userId", "plan", "status");

-- CreateIndex
CREATE INDEX "UserEntitlement_externalRef_idx" ON "UserEntitlement"("externalRef");

-- CreateIndex
CREATE UNIQUE INDEX "OptimizationTokenLedgerEntry_idempotencyKey_key" ON "OptimizationTokenLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "OptimizationTokenLedgerEntry_userId_createdAt_idx" ON "OptimizationTokenLedgerEntry"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OptimizationTokenLedgerEntry_relatedOptimizationRunId_idx" ON "OptimizationTokenLedgerEntry"("relatedOptimizationRunId");

-- CreateIndex
CREATE INDEX "OptimizationSelection_optimizationRunId_idx" ON "OptimizationSelection"("optimizationRunId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptRecord_jobId_key" ON "ReceiptRecord"("jobId");

-- CreateIndex
CREATE INDEX "ReceiptRecord_establishmentId_createdAt_idx" ON "ReceiptRecord"("establishmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ReceiptRecord_userId_createdAt_idx" ON "ReceiptRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReceiptRecord_parseStatus_createdAt_idx" ON "ReceiptRecord"("parseStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ReceiptRecord_accessKey_idx" ON "ReceiptRecord"("accessKey");

-- CreateIndex
CREATE INDEX "ReceiptRecord_storeCnpj_idx" ON "ReceiptRecord"("storeCnpj");

-- CreateIndex
CREATE INDEX "ReceiptRecord_duplicateKey_idx" ON "ReceiptRecord"("duplicateKey");

-- CreateIndex
CREATE INDEX "ReceiptRecord_moderationStatus_createdAt_idx" ON "ReceiptRecord"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ReceiptLineItem_receiptRecordId_idx" ON "ReceiptLineItem"("receiptRecordId");

-- CreateIndex
CREATE INDEX "ReceiptLineItem_ean_idx" ON "ReceiptLineItem"("ean");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_preferredRegionId_fkey" FOREIGN KEY ("preferredRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Establishment" ADD CONSTRAINT "Establishment_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocationPreference" ADD CONSTRAINT "UserLocationPreference_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLocationPreference" ADD CONSTRAINT "UserLocationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogProductAlias" ADD CONSTRAINT "CatalogProductAlias_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_receiptRecordId_fkey" FOREIGN KEY ("receiptRecordId") REFERENCES "ReceiptRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_receiptLineItemId_fkey" FOREIGN KEY ("receiptLineItemId") REFERENCES "ReceiptLineItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_preferredRegionId_fkey" FOREIGN KEY ("preferredRegionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingList" ADD CONSTRAINT "ShoppingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_catalogProductId_fkey" FOREIGN KEY ("catalogProductId") REFERENCES "CatalogProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_lockedProductVariantId_fkey" FOREIGN KEY ("lockedProductVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShoppingListItem" ADD CONSTRAINT "ShoppingListItem_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMismatchReport" ADD CONSTRAINT "PriceMismatchReport_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMismatchReport" ADD CONSTRAINT "PriceMismatchReport_shoppingListItemId_fkey" FOREIGN KEY ("shoppingListItemId") REFERENCES "ShoppingListItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceMismatchReport" ADD CONSTRAINT "PriceMismatchReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_preferredEstablishmentId_fkey" FOREIGN KEY ("preferredEstablishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_userLocationPreferenceId_fkey" FOREIGN KEY ("userLocationPreferenceId") REFERENCES "UserLocationPreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_shoppingListId_fkey" FOREIGN KEY ("shoppingListId") REFERENCES "ShoppingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationRun" ADD CONSTRAINT "OptimizationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntitlement" ADD CONSTRAINT "UserEntitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationTokenLedgerEntry" ADD CONSTRAINT "OptimizationTokenLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationTokenLedgerEntry" ADD CONSTRAINT "OptimizationTokenLedgerEntry_relatedOptimizationRunId_fkey" FOREIGN KEY ("relatedOptimizationRunId") REFERENCES "OptimizationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationSelection" ADD CONSTRAINT "OptimizationSelection_optimizationRunId_fkey" FOREIGN KEY ("optimizationRunId") REFERENCES "OptimizationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationSelection" ADD CONSTRAINT "OptimizationSelection_productOfferId_fkey" FOREIGN KEY ("productOfferId") REFERENCES "ProductOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptimizationSelection" ADD CONSTRAINT "OptimizationSelection_shoppingListItemId_fkey" FOREIGN KEY ("shoppingListItemId") REFERENCES "ShoppingListItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptRecord" ADD CONSTRAINT "ReceiptRecord_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptRecord" ADD CONSTRAINT "ReceiptRecord_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProcessingJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptRecord" ADD CONSTRAINT "ReceiptRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptLineItem" ADD CONSTRAINT "ReceiptLineItem_receiptRecordId_fkey" FOREIGN KEY ("receiptRecordId") REFERENCES "ReceiptRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
