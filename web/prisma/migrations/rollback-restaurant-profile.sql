-- Rollback script for Restaurant Profile Management
-- This script removes the new tables and fields added for the Restaurant Profile feature

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS "payment_info";
DROP TABLE IF EXISTS "restaurant_photos";
DROP TABLE IF EXISTS "locations";
DROP TABLE IF EXISTS "addresses";

-- Drop enum type
DROP TYPE IF EXISTS "photo_type";

-- Remove new fields from Restaurant table
ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "business_type";
ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "cuisine_type";
ALTER TABLE "restaurants" DROP COLUMN IF EXISTS "website_url";
