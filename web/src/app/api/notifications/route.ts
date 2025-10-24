import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for notification query parameters
const queryParamsSchema = z.object({
  limit: z.string().nullable().optional().transform(val => val && val !== 'null' ? parseInt(val) : 10),
  page: z.string().nullable().optional().transform(val => val && val !== 'null' ? parseInt(val) : 1),
  unreadOnly: z.string().nullable().optional().transform(val => val === 'true'),
  type: z.string().nullable().optional().transform(val => val && val !== 'null' ? val : undefined)
});

// Schema for marking notifications as read
const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  markAll: z.boolean().optional().default(false)
});

/**
 * GET /api/notifications
 * Get user notifications with pagination and filtering
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryParams = {
      limit: url.searchParams.get('limit'),
      page: url.searchParams.get('page'),
      unreadOnly: url.searchParams.get('unreadOnly'),
      type: url.searchParams.get('type')
    };

    const { limit, page, unreadOnly, type } = queryParamsSchema.parse(queryParams);
    const skip = (page - 1) * limit;

    // Build where clause based on filters
    const where: any = { userId: session.user.id };

    if (unreadOnly) {
      where.isRead = false;
    }

    if (type && type !== undefined && type !== 'null') {
      where.type = type;
    }

    // Get notifications with pagination
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Mark notifications as read
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
    const { ids, markAll } = markReadSchema.parse(body);

    if (markAll) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { 
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } else if (ids && ids.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: ids },
            userId: session.user.id
          },
        data: { 
          isRead: true,
          readAt: new Date()
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: `${ids.length} notification(s) marked as read` 
      });
    } else {
      return NextResponse.json(
        { error: 'No notifications specified to mark as read' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating notifications:', error);
    
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