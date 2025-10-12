# Restaurant Profile Schema Migration

This document provides instructions for applying the schema changes required for the Business Profile Management feature.

## Schema Changes Summary

We've added the following models to support the Business Profile Management feature:

1. **Address** - Structured address information with geocoding support
2. **Location** - Multi-location support for restaurants with multiple branches
3. **RestaurantPhoto** - Photo gallery for restaurant images
4. **PaymentInfo** - Payment information for restaurants

We've also updated the **Restaurant** model with new fields:
- `businessType` - Type of restaurant (cafe, fine dining, etc.)
- `cuisineType` - Type of cuisine served
- `websiteUrl` - Restaurant website

## Migration Instructions

### Option 1: Using Prisma Migrate (Recommended)

1. Make sure Docker is running
2. Start the database container:
   ```bash
   docker-compose up -d
   ```

3. Create a `.env` file in the `web` directory with the following content:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/restaurant_hiring"
   ```

4. Run the Prisma migration:
   ```bash
   cd web
   npx prisma migrate dev --name add_restaurant_profile_details
   ```

5. Run the data migration script:
   ```bash
   cd web
   npx ts-node scripts/migrate-restaurant-profiles.ts
   ```

### Option 2: Manual Migration

If you can't use Prisma Migrate, you can apply the SQL migration script directly:

1. Connect to your database
2. Run the SQL migration script:
   ```bash
   psql -U postgres -d restaurant_hiring -f web/prisma/migrations/migration-restaurant-profile.sql
   ```

3. Run the data migration script:
   ```bash
   cd web
   npx ts-node scripts/migrate-restaurant-profiles.ts
   ```

## Verifying the Migration

After applying the migration, you can verify that the schema changes were applied correctly by running:

```bash
cd web
npx prisma db pull
```

This will update your Prisma schema to match the database schema.

## Rollback Instructions

If you need to rollback the migration, you can use the following commands:

```bash
cd web
npx prisma migrate reset
```

Or manually run the rollback script:

```bash
psql -U postgres -d restaurant_hiring -f web/prisma/migrations/rollback-restaurant-profile.sql
```
