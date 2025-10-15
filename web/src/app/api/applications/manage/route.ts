import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { notifyApplicationStatus } from '@/lib/utils/notificationUtils';

// Schema for application status update
const applicationUpdateSchema = z.object({
  id: z.string().min(1, 'Application ID is required'),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'INTERVIEWING']),
  responseNote: z.string().optional()
});

/**
 * PUT /api/applications/manage
 * Update application status (for restaurant owners)
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only restaurant owners can update application status
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, status, responseNote } = applicationUpdateSchema.parse(body);

    // Get the restaurant for this owner
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        worker: {
          include: {
            user: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Verify the application belongs to this restaurant
    if (application.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        responseNote,
        respondedAt: new Date()
      },
      include: {
        job: true,
        worker: true
      }
    });

    // Send notification to worker about application status change
    await notifyApplicationStatus(
      application.workerId,
      application.id,
      application.job.title,
      status
    );

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error('Error updating application:', error);
    
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