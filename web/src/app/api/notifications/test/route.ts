import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';
import { NotificationTriggers } from '@/lib/services/NotificationTriggers';

/**
 * POST /api/notifications/test
 * Test endpoint for demonstrating real-time notifications
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type = 'test', title, message, data } = body;

    const notificationService = NotificationService.getInstance();

    switch (type) {
      case 'test':
        await notificationService.sendNotificationInstance({
          userId: session.user.id,
          type: 'SYSTEM_ALERT',
          title: title || 'Test Notification',
          message: message || 'This is a test notification from the system.',
          data: data || { test: true }
        });
        break;

      case 'application_test':
        // Simulate application status change
        await NotificationTriggers.onApplicationStatusChanged(
          'test-app-id',
          'ACCEPTED',
          'Great work! We were impressed with your qualifications.'
        );
        break;

      case 'job_test':
        // Simulate new job posted (you'd need a real job ID)
        await NotificationTriggers.onJobPosted('test-job-id');
        break;

      case 'maintenance':
        const maintenanceTime = new Date();
        maintenanceTime.setHours(maintenanceTime.getHours() + 2);
        
        await NotificationTriggers.triggerSystemMaintenance(
          'The system will undergo scheduled maintenance for performance improvements. Service may be briefly interrupted.',
          maintenanceTime
        );
        break;

      case 'bulk_notification':
        // Send to multiple users (for testing)
        const userIds = [session.user.id]; // In a real scenario, you'd have multiple user IDs
        
        await notificationService.createBulkNotifications(userIds, {
          type: 'SYSTEM_ALERT',
          title: 'Bulk Notification Test',
          message: 'This is a test of the bulk notification system.',
          data: { bulk: true }
        });
        break;

      case 'realtime_test':
        // Send directly via SSE without storing in database
        notificationService.sendToUser(session.user.id, {
          id: `test_${Date.now()}`,
          userId: session.user.id,
          type: 'SYSTEM_ALERT',
          title: 'Real-time Test',
          message: 'This notification was sent directly via SSE!',
          data: { realtime: true }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid test type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Test notification of type '${type}' sent successfully`,
      connections: notificationService.getTotalSSEConnections(),
      connectedUsers: notificationService.getConnectedUsers()
    });

  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/test
 * Get notification system status
 */
export async function GET() {
  try {
    const notificationService = NotificationService.getInstance();
    
    return NextResponse.json({
      status: 'active',
      totalConnections: notificationService.getTotalSSEConnections(),
      connectedUsers: notificationService.getConnectedUsers(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting notification status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}