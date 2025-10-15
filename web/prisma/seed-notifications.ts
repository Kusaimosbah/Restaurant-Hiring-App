import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding notification preferences for existing users...');
  
  // Get all users without notification preferences
  const users = await prisma.user.findMany({
    where: {
      notificationPreference: null
    },
    select: {
      id: true,
      role: true,
      email: true
    }
  });
  
  console.log(`Found ${users.length} users without notification preferences`);
  
  // Create default notification preferences for each user
  for (const user of users) {
    await prisma.notificationPreference.create({
      data: {
        userId: user.id,
        // Default all to true
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        applicationUpdates: true,
        messages: true,
        jobPostings: true,
        shiftReminders: true,
        reviewsAndRatings: true,
        paymentUpdates: true
      }
    });
    
    console.log(`Created notification preferences for user ${user.email}`);
    
    // Create sample notifications for each user
    if (user.role === 'RESTAURANT_OWNER') {
      await createRestaurantOwnerNotifications(user.id);
    } else if (user.role === 'WORKER') {
      await createWorkerNotifications(user.id);
    }
  }
  
  console.log('Notification seeding complete!');
}

async function createRestaurantOwnerNotifications(userId: string) {
  // Create sample notifications for restaurant owners
  await prisma.notification.createMany({
    data: [
      {
        userId,
        type: 'NEW_APPLICATION',
        title: 'New Application Received',
        message: 'A new application has been submitted for Server position',
        isRead: false,
        data: { applicationId: 'sample-app-id', jobTitle: 'Server' }
      },
      {
        userId,
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: 'You have a new message from John Smith',
        isRead: true,
        readAt: new Date(),
        data: { conversationId: 'sample-conv-id', senderId: 'sample-user-id' }
      },
      {
        userId,
        type: 'SYSTEM_ALERT',
        title: 'Account Verification',
        message: 'Please verify your business details to unlock all features',
        isRead: false,
        data: { action: 'verify_business' }
      }
    ]
  });
  
  console.log(`Created sample notifications for restaurant owner ${userId}`);
}

async function createWorkerNotifications(userId: string) {
  // Create sample notifications for workers
  await prisma.notification.createMany({
    data: [
      {
        userId,
        type: 'APPLICATION_STATUS',
        title: 'Application Update',
        message: 'Your application for Chef position has been accepted',
        isRead: false,
        data: { applicationId: 'sample-app-id', status: 'ACCEPTED', jobTitle: 'Chef' }
      },
      {
        userId,
        type: 'NEW_JOB',
        title: 'New Job Posting',
        message: 'A new Server position is available that matches your profile',
        isRead: true,
        readAt: new Date(),
        data: { jobId: 'sample-job-id', jobTitle: 'Server' }
      },
      {
        userId,
        type: 'SHIFT_REMINDER',
        title: 'Upcoming Shift',
        message: 'Reminder: You have a shift tomorrow at 9:00 AM',
        isRead: false,
        data: { shiftId: 'sample-shift-id', startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }
      }
    ]
  });
  
  console.log(`Created sample notifications for worker ${userId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
