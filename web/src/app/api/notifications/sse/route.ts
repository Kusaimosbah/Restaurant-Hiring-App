import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notificationService';

// This endpoint uses Server-Sent Events (SSE) for real-time notifications
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const notificationService = NotificationService.getInstance();

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const stream = new ReadableStream({
      start(controller) {
        // Add connection to notification service
        const connectionId = notificationService.addSSEConnection(userId, controller);
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          console.log(`SSE connection closed for user: ${userId}`);
          notificationService.removeSSEConnection(userId, connectionId);
        });
      },
      cancel() {
        console.log(`SSE stream cancelled for user: ${userId}`);
      }
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Error setting up SSE connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
