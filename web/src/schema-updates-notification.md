# Notification System Schema Updates

We need to add the following models to support the notification system:

## New Models

### Notification
```prisma
model Notification {
  id          String            @id @default(cuid())
  userId      String
  type        NotificationType
  title       String
  message     String
  data        Json?             // Additional data specific to notification type
  isRead      Boolean           @default(false)
  readAt      DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  user        User              @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("notifications")
}
```

### NotificationPreference
```prisma
model NotificationPreference {
  id                String                @id @default(cuid())
  userId            String                @unique
  emailEnabled      Boolean               @default(true)
  pushEnabled       Boolean               @default(true)
  inAppEnabled      Boolean               @default(true)
  applicationUpdates Boolean               @default(true)
  messages          Boolean               @default(true)
  jobPostings       Boolean               @default(true)
  shiftReminders    Boolean               @default(true)
  reviewsAndRatings Boolean               @default(true)
  paymentUpdates    Boolean               @default(true)
  createdAt         DateTime              @default(now())
  updatedAt         DateTime              @updatedAt
  user              User                  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notification_preferences")
}
```

### NotificationDevice
```prisma
model NotificationDevice {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  platform  String   // "ios", "android", "web"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("notification_devices")
}
```

## New Enum

```prisma
enum NotificationType {
  APPLICATION_STATUS
  NEW_APPLICATION
  NEW_MESSAGE
  NEW_JOB
  SHIFT_REMINDER
  SHIFT_ASSIGNED
  PAYMENT_UPDATE
  NEW_REVIEW
  PROFILE_VIEW
  SYSTEM_ALERT
}
```

## Updates to User Model

```prisma
model User {
  // existing fields...
  
  notifications           Notification[]
  notificationPreference  NotificationPreference?
  notificationDevices     NotificationDevice[]
}
```
