CREATE TYPE "UserPushDevicePlatform" AS ENUM (
  'android',
  'ios'
);

CREATE TABLE "UserPushDevice" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "platform" "UserPushDevicePlatform" NOT NULL,
  "deviceTokenHash" TEXT NOT NULL,
  "deviceTokenTail" VARCHAR(16) NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'fcm',
  "appVersion" TEXT,
  "locale" TEXT,
  "timezone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "revokedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPushDevice_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD COLUMN "pushDeviceId" UUID;

CREATE UNIQUE INDEX "UserPushDevice_deviceTokenHash_key"
ON "UserPushDevice"("deviceTokenHash");

CREATE INDEX "UserPushDevice_userId_isActive_lastSeenAt_idx"
ON "UserPushDevice"("userId", "isActive", "lastSeenAt");

CREATE INDEX "UserPushDevice_platform_isActive_idx"
ON "UserPushDevice"("platform", "isActive");

CREATE INDEX "notification_delivery_push_device_idx"
ON "UserNotificationDeliveryAttempt"("pushDeviceId", "status");

ALTER TABLE "UserPushDevice"
ADD CONSTRAINT "UserPushDevice_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD CONSTRAINT "UserNotificationDeliveryAttempt_pushDeviceId_fkey"
FOREIGN KEY ("pushDeviceId") REFERENCES "UserPushDevice"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
