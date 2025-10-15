# Worker Profile Migration Guide

This guide explains how to apply the schema changes for the Worker Profile feature.

## Applying the Migration

1. Make sure your database is running:
   ```
   docker-compose up -d
   ```

2. Apply the migration manually:
   ```
   cd web
   npx prisma db execute --file ./prisma/migrations/migration-worker-profile.sql
   npx prisma db push
   ```

3. Update the Prisma client:
   ```
   npx prisma generate
   ```

## Rolling Back (If Needed)

If you need to roll back the changes:

1. Execute the rollback SQL script:
   ```
   cd web
   npx prisma db execute --file ./prisma/migrations/rollback-worker-profile.sql
   ```

2. Revert the schema changes in `schema.prisma`

3. Update the Prisma client:
   ```
   npx prisma generate
   ```

## Seeding Sample Data

After applying the migration, you can seed the database with sample worker profile data:

```
cd web
npm run seed
```

## Verifying the Migration

You can verify the migration was successful by checking the database schema:

```
cd web
npx prisma studio
```

Look for the new tables:
- worker_skills
- certifications
- worker_documents

And check that the worker_profiles table has the new fields.
