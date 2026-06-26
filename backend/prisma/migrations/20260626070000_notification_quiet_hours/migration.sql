ALTER TABLE "UserNotificationPreference"
ADD COLUMN "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "quietHoursStartMinute" INTEGER,
ADD COLUMN "quietHoursEndMinute" INTEGER,
ADD COLUMN "quietHoursTimezone" TEXT;
