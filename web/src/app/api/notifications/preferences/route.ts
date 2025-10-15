import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for notification preferences
const preferencesSchema = z.object({
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  applicationUpdates: z.boolean().optional(),
  messages: z.boolean().optional(),
  jobPostings: z.boolean().optional(),
  shiftReminders: z.boolean().optional(),
  reviewsAndRatings: z.boolean().optional(),
  paymentUpdates: z.boolean().optional()
});

/**
 * GET /api/notifications/preferences
 * Get user notification preferences
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

    // Get or create notification preferences
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId: session.user.id }
    });

    if (!preferences) {
      // Create default preferences if they don't exist
      preferences = await prisma.notificationPreference.create({
        data: {
          userId: session.user.id,
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
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
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

    const body = await request.json();
    const validatedData = preferencesSchema.parse(body);

    // Update or create preferences
    const preferences = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      update: validatedData,
      create: {
        userId: session.user.id,
        ...validatedData
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    
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
