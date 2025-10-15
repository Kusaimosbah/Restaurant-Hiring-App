import { NotificationType } from '@prisma/client';
import { NotificationService } from '@/lib/services/notificationService';

/**
 * Helper function to create application status notifications
 */
export async function notifyApplicationStatus(
  workerId: string,
  applicationId: string,
  jobTitle: string,
  status: string
): Promise<boolean> {
  let title = '';
  let message = '';
  
  switch (status) {
    case 'ACCEPTED':
      title = 'Application Accepted';
      message = `Your application for ${jobTitle} has been accepted!`;
      break;
    case 'REJECTED':
      title = 'Application Status Update';
      message = `Your application for ${jobTitle} was not selected at this time.`;
      break;
    case 'INTERVIEWING':
      title = 'Interview Request';
      message = `You've been selected for an interview for the ${jobTitle} position.`;
      break;
    default:
      title = 'Application Status Update';
      message = `Your application for ${jobTitle} has been updated to: ${status}`;
  }
  
  return NotificationService.sendNotification({
    userId: workerId,
    type: 'APPLICATION_STATUS',
    title,
    message,
    data: { applicationId, status, jobTitle }
  });
}

/**
 * Helper function to create new application notifications
 */
export async function notifyNewApplication(
  restaurantOwnerId: string,
  applicationId: string,
  workerName: string,
  jobTitle: string
): Promise<boolean> {
  return NotificationService.sendNotification({
    userId: restaurantOwnerId,
    type: 'NEW_APPLICATION',
    title: 'New Application Received',
    message: `${workerName} applied for the ${jobTitle} position`,
    data: { applicationId, workerName, jobTitle }
  });
}

/**
 * Helper function to create new message notifications
 */
export async function notifyNewMessage(
  recipientId: string,
  senderId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<boolean> {
  return NotificationService.sendNotification({
    userId: recipientId,
    type: 'NEW_MESSAGE',
    title: 'New Message',
    message: `${senderName}: ${messagePreview}`,
    data: { senderId, conversationId }
  });
}

/**
 * Helper function to create new job notifications
 */
export async function notifyNewJob(
  workerId: string,
  jobId: string,
  jobTitle: string,
  restaurantName: string
): Promise<boolean> {
  return NotificationService.sendNotification({
    userId: workerId,
    type: 'NEW_JOB',
    title: 'New Job Opportunity',
    message: `${restaurantName} posted a new ${jobTitle} position that matches your profile`,
    data: { jobId, jobTitle, restaurantName }
  });
}

/**
 * Helper function to create shift reminder notifications
 */
export async function notifyShiftReminder(
  workerId: string,
  shiftId: string,
  jobTitle: string,
  restaurantName: string,
  startTime: Date
): Promise<boolean> {
  const formattedTime = startTime.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
  
  return NotificationService.sendNotification({
    userId: workerId,
    type: 'SHIFT_REMINDER',
    title: 'Upcoming Shift Reminder',
    message: `You have a ${jobTitle} shift at ${restaurantName} on ${formattedTime}`,
    data: { shiftId, jobTitle, restaurantName, startTime: startTime.toISOString() }
  });
}

/**
 * Helper function to create new review notifications
 */
export async function notifyNewReview(
  recipientId: string,
  reviewId: string,
  reviewerName: string,
  rating: number
): Promise<boolean> {
  return NotificationService.sendNotification({
    userId: recipientId,
    type: 'NEW_REVIEW',
    title: 'New Review Received',
    message: `${reviewerName} left you a ${rating}-star review`,
    data: { reviewId, reviewerName, rating }
  });
}
