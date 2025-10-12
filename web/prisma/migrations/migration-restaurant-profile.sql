-- Migration script for Restaurant Profile Management
-- This script adds the new tables and updates the Restaurant model

-- Add new fields to Restaurant table
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "business_type" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cuisine_type" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "website_url" TEXT;

-- Create Address table
CREATE TABLE IF NOT EXISTS "addresses" (
  "id" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip_code" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'United States',
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "restaurant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "addresses_restaurant_id_key" UNIQUE ("restaurant_id"),
  CONSTRAINT "addresses_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "addresses_restaurant_id_idx" ON "addresses"("restaurant_id");

-- Create Location table
CREATE TABLE IF NOT EXISTS "locations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "zip_code" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'United States',
  "phone" TEXT,
  "email" TEXT,
  "is_main_location" BOOLEAN NOT NULL DEFAULT false,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "restaurant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "locations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "locations_restaurant_id_idx" ON "locations"("restaurant_id");

-- Create PhotoType enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "photo_type" AS ENUM ('INTERIOR', 'EXTERIOR', 'FOOD', 'STAFF', 'MENU', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create RestaurantPhoto table
CREATE TABLE IF NOT EXISTS "restaurant_photos" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "type" "photo_type" NOT NULL DEFAULT 'INTERIOR',
  "restaurant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "restaurant_photos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "restaurant_photos_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "restaurant_photos_restaurant_id_idx" ON "restaurant_photos"("restaurant_id");

-- Create PaymentInfo table
CREATE TABLE IF NOT EXISTS "payment_info" (
  "id" TEXT NOT NULL,
  "stripe_customer_id" TEXT,
  "stripe_account_id" TEXT,
  "bank_account_last4" TEXT,
  "card_last4" TEXT,
  "is_verified" BOOLEAN NOT NULL DEFAULT false,
  "restaurant_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_info_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_info_restaurant_id_key" UNIQUE ("restaurant_id"),
  CONSTRAINT "payment_info_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "payment_info_restaurant_id_idx" ON "payment_info"("restaurant_id");

-- Data migration: Create Address records for existing restaurants
INSERT INTO "addresses" ("id", "street", "city", "state", "zip_code", "country", "restaurant_id", "created_at", "updated_at")
SELECT 
  gen_random_uuid(), -- Generate UUID for id
  "address", -- Use existing address as street
  '', -- Empty city
  '', -- Empty state
  '', -- Empty zip
  'United States', -- Default country
  "id", -- restaurant_id
  CURRENT_TIMESTAMP, -- created_at
  CURRENT_TIMESTAMP -- updated_at
FROM "restaurants"
WHERE "id" NOT IN (SELECT "restaurant_id" FROM "addresses")
AND "address" IS NOT NULL;

-- Data migration: Create main location for existing restaurants
INSERT INTO "locations" ("id", "name", "street", "city", "state", "zip_code", "country", "is_main_location", "restaurant_id", "created_at", "updated_at")
SELECT 
  gen_random_uuid(), -- Generate UUID for id
  "name" || ' - Main Location', -- Location name
  "address", -- Use existing address as street
  '', -- Empty city
  '', -- Empty state
  '', -- Empty zip
  'United States', -- Default country
  true, -- is_main_location
  "id", -- restaurant_id
  CURRENT_TIMESTAMP, -- created_at
  CURRENT_TIMESTAMP -- updated_at
FROM "restaurants"
WHERE "id" NOT IN (SELECT "restaurant_id" FROM "locations" WHERE "is_main_location" = true)
AND "address" IS NOT NULL;
