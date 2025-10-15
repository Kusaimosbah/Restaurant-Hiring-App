# Notification System

This document provides an overview of the notification system implemented in the Restaurant Hiring App.

## Features

- **In-app notifications**: Real-time notifications displayed in the UI
- **Email notifications**: Email delivery for important updates (simulated in development)
- **Push notifications**: Mobile and web push notifications (simulated in development)
- **Notification preferences**: User-configurable settings for notification delivery
- **Real-time updates**: Server-Sent Events (SSE) for instant notification delivery
- **Notification center**: Dedicated page for viewing all notifications with filtering and pagination
- **Read/unread status**: Track which notifications have been viewed

## Architecture

### Database Models

- `Notification`: Stores individual notifications with type, content, and read status
- `NotificationPreference`: Stores user preferences for notification delivery
- `NotificationDevice`: Stores device tokens for push notifications

### API Endpoints

- `GET /api/notifications`: Fetch notifications with pagination and filtering
- `POST /api/notifications`: Mark notifications as read
- `GET /api/notifications/[id]`: Get a specific notification
- `PUT /api/notifications/[id]`: Mark a specific notification as read
- `DELETE /api/notifications/[id]`: Delete a notification
- `GET /api/notifications/preferences`: Get user notification preferences
- `PUT /api/notifications/preferences`: Update user notification preferences
- `GET /api/notifications/devices`: Get registered devices
- `POST /api/notifications/devices`: Register a device for push notifications
- `DELETE /api/notifications/devices`: Unregister a device
- `GET /api/notifications/sse`: Server-Sent Events endpoint for real-time notifications

### UI Components

- `NotificationIcon`: Bell icon with unread count in the header
- `NotificationDropdown`: Dropdown menu showing recent notifications
- `NotificationItem`: Individual notification display
- `NotificationsPage`: Full page for viewing all notifications
- `NotificationPreferencesPage`: Page for configuring notification settings

### Hooks and Services

- `useNotifications`: React hook for accessing notifications and related functions
- `NotificationService`: Service for sending notifications through different channels
- `notificationUtils`: Helper functions for creating specific notification types

## Notification Types

The system supports various notification types:

- `APPLICATION_STATUS`: Updates on job application status
- `NEW_APPLICATION`: New job applications received
- `NEW_MESSAGE`: New messages received
- `NEW_JOB`: New job postings that match worker profiles
- `SHIFT_REMINDER`: Reminders for upcoming shifts
- `SHIFT_ASSIGNED`: New shift assignments
- `PAYMENT_UPDATE`: Updates on payment status
- `NEW_REVIEW`: New reviews received
- `PROFILE_VIEW`: Profile view notifications
- `SYSTEM_ALERT`: System-wide alerts and announcements

## Usage Examples

### Sending a Notification

```typescript
import { NotificationService } from '@/lib/services/notificationService';

await NotificationService.sendNotification({
  userId: "user-id",
  type: "NEW_MESSAGE",
  title: "New Message",
  message: "You have a new message from John",
  data: { conversationId: "conv-id" }
});
```

### Using Notification Helpers

```typescript
import { notifyApplicationStatus } from '@/lib/utils/notificationUtils';

await notifyApplicationStatus(
  workerId,
  applicationId,
  "Server",
  "ACCEPTED"
);
```

### Using the Notifications Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount,
    markAsRead,
    markAllAsRead 
  } = useNotifications();
  
  // Use notification data and functions
}
```

## Implementation Notes

- The real-time notification delivery uses Server-Sent Events (SSE) for efficient one-way communication
- Email notifications are simulated in development but can be integrated with services like SendGrid
- Push notifications are simulated but can be implemented using Firebase Cloud Messaging or similar services
- Notification preferences allow users to control which notifications they receive and through which channels
