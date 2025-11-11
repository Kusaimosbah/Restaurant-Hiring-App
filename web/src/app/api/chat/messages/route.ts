import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Messages API Endpoint
 * GET /api/chat/messages - Get messages for a conversation
 * POST /api/chat/messages - Send a new message
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    // Get messages between current user and recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: session.user.id,
            recipientId: recipientId
          },
          {
            senderId: recipientId,
            recipientId: session.user.id
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Reverse to show oldest first
      total: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, content, jobId, applicationId } = body;

    // Validate required fields
    if (!recipientId || !content) {
      return NextResponse.json(
        { error: 'Recipient ID and content are required' },
        { status: 400 }
      );
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true, email: true }
    });

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        recipientId,
        applicationId
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: `${session.user.name}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        data: {
          messageId: message.id,
          senderId: session.user.id,
          senderName: session.user.name
        },
        userId: recipientId
      }
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        recipientId: message.recipientId,
        applicationId: message.applicationId,
        createdAt: message.createdAt,
        sender: message.sender,
        recipient: message.recipient
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}