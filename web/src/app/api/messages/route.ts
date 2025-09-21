import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const sendMessageSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1),
  applicationId: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');
    const applicationId = searchParams.get('applicationId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Build the where clause
    let whereClause: any = {
      OR: [
        { senderId: session.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: session.user.id }
      ]
    };

    // If applicationId is provided, filter by it
    if (applicationId) {
      whereClause.applicationId = applicationId;
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, role: true }
        },
        application: {
          select: { id: true, job: { select: { title: true } } }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: session.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, applicationId } = sendMessageSchema.parse(body);

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, role: true }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Verify application exists if provided
    if (applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          job: { include: { restaurant: true } },
          worker: true
        }
      });

      if (!application) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Verify user has permission to message about this application
      const userRole = session.user.role;
      const isRestaurantOwner = userRole === 'RESTAURANT_OWNER';
      const isWorker = userRole === 'WORKER';

      if (isRestaurantOwner && application.job.restaurant.ownerId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized to message about this application' }, { status: 403 });
      }

      if (isWorker && application.worker.userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized to message about this application' }, { status: 403 });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: session.user.id,
        receiverId,
        applicationId
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, role: true }
        },
        application: {
          select: { id: true, job: { select: { title: true } } }
        }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}