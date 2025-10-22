import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connection_established', message: 'Connected to notification stream' })}\n\n`));
        
        // Set up interval to send keep-alive messages
        const keepAliveInterval = setInterval(() => {
          controller.enqueue(encoder.encode(`: keep-alive\n\n`));
        }, 30000); // Every 30 seconds
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          clearInterval(keepAliveInterval);
        });
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
