-- Drop foreign key constraints first
ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "notifications_userId_fkey";
ALTER TABLE "notification_preferences" DROP CONSTRAINT IF EXISTS "notification_preferences_userId_fkey";
ALTER TABLE "notification_devices" DROP CONSTRAINT IF EXISTS "notification_devices_userId_fkey";

-- Drop tables
DROP TABLE IF EXISTS "notifications";
DROP TABLE IF EXISTS "notification_preferences";
DROP TABLE IF EXISTS "notification_devices";

-- Drop enum
DROP TYPE IF EXISTS "NotificationType";
