# Training System Migration Guide

This guide explains how to apply the database schema changes for the Onboarding & Training System feature.

## Overview

The migration adds the following tables:
- `training_modules` - For organizing training content
- `training_materials` - For actual content (videos, documents, quizzes)
- `training_progress` - To track user completion

And the following enums:
- `MaterialType` - Types of training materials (VIDEO, DOCUMENT, QUIZ, INTERACTIVE)
- `ProgressStatus` - Status of training progress (NOT_STARTED, IN_PROGRESS, COMPLETED)

## Apply the Migration

### Option 1: Using the SQL File Directly

1. Make sure your database is running:
   ```bash
   docker-compose up -d postgres
   ```

2. Apply the migration SQL:
   ```bash
   cd web
   npx prisma db execute --schema=./prisma/schema.prisma --file ./prisma/migrations/migration-training-system.sql
   ```

3. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```

### Option 2: Using Prisma Migrate (Development)

1. Update the `schema.prisma` file with the new models from `schema-updates-training.md`

2. Run Prisma Migrate:
   ```bash
   cd web
   npx prisma migrate dev --name add-training-system
   ```

## Rollback the Migration

If you need to roll back the changes:

```bash
cd web
npx prisma db execute --schema=./prisma/schema.prisma --file ./prisma/migrations/rollback-training-system.sql
```

## Seed Data

After applying the migration, you can seed the database with initial training modules:

```bash
cd web
npm run db:seed:training
```

## Verify the Migration

To verify that the migration was applied correctly:

```bash
cd web
npx prisma studio
```

This will open Prisma Studio at http://localhost:5555 where you can inspect the new tables.
