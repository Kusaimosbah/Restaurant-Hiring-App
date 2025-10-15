import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { notifyNewMessage } from '@/lib/utils/notificationUtils';

// Schema for message creation
const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  applicationId: z.string().optional(),
  conversationId: z.string().optional()
});

/**
 * POST /api/messages
 * Send a new message
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, receiverId, applicationId, conversationId } = messageSchema.parse(body);

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        applicationId,
        conversationId: conversationId || undefined
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    // Send notification to receiver
    await notifyNewMessage(
      receiverId,
      session.user.id,
      message.sender.name,
      content.substring(0, 50) + (content.length > 50 ? '...' : ''),
      conversationId || message.id
    );

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}