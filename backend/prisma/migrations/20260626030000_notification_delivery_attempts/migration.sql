CREATE TYPE "UserNotificationDeliveryChannel" AS ENUM (
  'email',
  'push'
);

CREATE TYPE "UserNotificationDeliveryStatus" AS ENUM (
  'queued',
  'sending',
  'retrying',
  'delivered',
  'failed'
);

CREATE TABLE "UserNotificationDeliveryAttempt" (
  "id" UUID NOT NULL,
  "notificationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "channel" "UserNotificationDeliveryChannel" NOT NULL,
  "status" "UserNotificationDeliveryStatus" NOT NULL DEFAULT 'queued',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "providerMessageId" TEXT,
  "lastFailureReason" TEXT,
  "terminalFailureReason" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "lastAttemptAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserNotificationDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notification_delivery_status_due_idx"
ON "UserNotificationDeliveryAttempt"("status", "nextAttemptAt", "createdAt");

CREATE INDEX "notification_delivery_user_channel_status_idx"
ON "UserNotificationDeliveryAttempt"("userId", "channel", "status");

CREATE INDEX "notification_delivery_notification_channel_idx"
ON "UserNotificationDeliveryAttempt"("notificationId", "channel", "createdAt");

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD CONSTRAINT "UserNotificationDeliveryAttempt_notificationId_fkey"
FOREIGN KEY ("notificationId") REFERENCES "UserNotification"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserNotificationDeliveryAttempt"
ADD CONSTRAINT "UserNotificationDeliveryAttempt_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserAccount"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
