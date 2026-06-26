CREATE TYPE "UserNotificationType" AS ENUM (
  'price_drop',
  'receipt_outcome',
  'optimization_ready',
  'optimization_failed'
);

CREATE TABLE "UserNotificationPreference" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
  "priceDropsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "receiptOutcomesEnabled" BOOLEAN NOT NULL DEFAULT true,
  "optimizationReadyEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserNotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserNotification" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "UserNotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "resourceType" TEXT,
  "resourceId" TEXT,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserNotificationPreference_userId_key"
ON "UserNotificationPreference"("userId");

CREATE INDEX "UserNotification_userId_readAt_createdAt_idx"
ON "UserNotification"("userId", "readAt", "createdAt");

CREATE INDEX "UserNotification_type_createdAt_idx"
ON "UserNotification"("type", "createdAt");

ALTER TABLE "UserNotificationPreference"
ADD CONSTRAINT "UserNotificationPreference_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotification"
ADD CONSTRAINT "UserNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
