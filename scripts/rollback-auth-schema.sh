#!/bin/bash

# Rollback Script for Feature 01 Auth Schema Changes
# This script reverts the auth-related schema changes if needed

set -e

echo "🔄 Rolling back Feature 01 auth schema changes..."

# Check if we're in the right directory
if [ ! -f "web/prisma/schema.prisma" ]; then
    echo "❌ Error: Must run from Restaurant-Hiring-App root directory"
    exit 1
fi

# Backup current schema
cp web/prisma/schema.prisma web/prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)

echo "📦 Backed up current schema"

# Drop the new auth tables
echo "🗑️ Dropping auth tables..."

# Connect to database and drop tables
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
-- Drop new auth tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "password_reset_tokens";
DROP TABLE IF EXISTS "email_verification_tokens"; 
DROP TABLE IF EXISTS "refresh_tokens";

-- Remove new columns from users table
ALTER TABLE "users" 
  DROP COLUMN IF EXISTS "phone",
  DROP COLUMN IF EXISTS "emailVerifiedAt",
  DROP COLUMN IF EXISTS "failedLoginCount", 
  DROP COLUMN IF EXISTS "lockedUntil",
  DROP COLUMN IF EXISTS "lastLoginAt";

EOF

echo "✅ Database rollback completed"

# Restore original schema (user will need to manually revert schema.prisma)
echo "⚠️  Manual step: Revert web/prisma/schema.prisma to remove auth models"
echo "⚠️  Then run: cd web && npx prisma generate"

echo "🎯 Rollback completed. Verify with: cd web && npx prisma db pull"