CREATE TYPE "UserEmailNotificationStatus" AS ENUM (
  'pending',
  'verified',
  'unsubscribed'
);

CREATE TABLE "UserEmailNotificationDestination" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "email" TEXT NOT NULL,
  "status" "UserEmailNotificationStatus" NOT NULL DEFAULT 'pending',
  "verificationTokenHash" TEXT,
  "unsubscribeTokenHash" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "unsubscribedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserEmailNotificationDestination_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD COLUMN "emailDestinationId" UUID;

CREATE UNIQUE INDEX "UserEmailNotificationDestination_userId_key"
ON "UserEmailNotificationDestination"("userId");

CREATE UNIQUE INDEX "UserEmailNotificationDestination_verificationTokenHash_key"
ON "UserEmailNotificationDestination"("verificationTokenHash");

CREATE UNIQUE INDEX "UserEmailNotificationDestination_unsubscribeTokenHash_key"
ON "UserEmailNotificationDestination"("unsubscribeTokenHash");

CREATE INDEX "UserEmailNotificationDestination_email_status_idx"
ON "UserEmailNotificationDestination"("email", "status");

CREATE INDEX "notification_delivery_email_destination_idx"
ON "UserNotificationDeliveryAttempt"("emailDestinationId", "status");

ALTER TABLE "UserEmailNotificationDestination"
ADD CONSTRAINT "UserEmailNotificationDestination_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD CONSTRAINT "UserNotificationDeliveryAttempt_emailDestinationId_fkey"
FOREIGN KEY ("emailDestinationId") REFERENCES "UserEmailNotificationDestination"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
