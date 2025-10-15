# Notification System Migration Guide

This document explains how to apply the schema changes for the notification system feature.

## Overview

The migration adds the following models:
- `Notification`: Stores individual notifications for users
- `NotificationPreference`: Stores user preferences for notification delivery
- `NotificationDevice`: Stores device tokens for push notifications
- `NotificationType`: Enum for different notification categories

## Steps to Apply Migration

### 1. Start the database

Make sure the PostgreSQL database is running:

```bash
docker-compose up -d
```

### 2. Apply the migration

From the `web` directory, run:

```bash
npx prisma db execute --file ./prisma/migrations/migration-notification-system.sql
```

### 3. Generate Prisma client

After applying the migration, generate the updated Prisma client:

```bash
npx prisma generate
```

### 4. Seed initial notification preferences (optional)

To create default notification preferences for existing users:

```bash
npx ts-node prisma/seed-notifications.ts
```

## Rollback Instructions

If you need to revert the changes:

```bash
npx prisma db execute --file ./prisma/migrations/rollback-notification-system.sql
```

## Verification

To verify the migration was successful:

```bash
npx prisma studio
```

Check that the following tables exist:
- `notifications`
- `notification_preferences`
- `notification_devices`
