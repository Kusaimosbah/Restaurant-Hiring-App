import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createReviewSchema = z.object({
  targetType: z.enum(['worker', 'restaurant']),
  targetId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isPublic: z.boolean().default(true)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('targetType');
    const targetId = searchParams.get('targetId');

    if (!targetType || !targetId) {
      return NextResponse.json({ error: 'Target type and ID required' }, { status: 400 });
    }

    let reviews;
    
    if (targetType === 'worker') {
      reviews = await prisma.reviewWorker.findMany({
        where: {
          workerId: targetId,
          isPublic: true
        },
        include: {
          restaurant: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (targetType === 'restaurant') {
      reviews = await prisma.reviewRestaurant.findMany({
        where: {
          restaurantId: targetId,
          isPublic: true
        },
        include: {
          worker: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }

    // Calculate average rating
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
      : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
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
    const { targetType, targetId, rating, comment, isPublic } = createReviewSchema.parse(body);

    // Verify the user has permission to review this target
    if (targetType === 'worker') {
      // Only restaurant owners can review workers
      if (session.user.role !== 'RESTAURANT_OWNER') {
        return NextResponse.json({ error: 'Only restaurant owners can review workers' }, { status: 403 });
      }

      // Verify the worker exists
      const worker = await prisma.workerProfile.findUnique({
        where: { id: targetId }
      });

      if (!worker) {
        return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
      }

      // Get restaurant ID
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      });

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }

      // Check if review already exists
      const existingReview = await prisma.reviewWorker.findFirst({
        where: {
          workerId: targetId,
          restaurantId: restaurant.id
        }
      });

      if (existingReview) {
        // Update existing review
        const updatedReview = await prisma.reviewWorker.update({
          where: { id: existingReview.id },
          data: { rating, comment, isPublic },
          include: {
            restaurant: { select: { name: true } }
          }
        });

        return NextResponse.json(updatedReview);
      } else {
        // Create new review
        const newReview = await prisma.reviewWorker.create({
          data: {
            rating,
            comment,
            isPublic,
            workerId: targetId,
            restaurantId: restaurant.id
          },
          include: {
            restaurant: { select: { name: true } }
          }
        });

        return NextResponse.json(newReview);
      }

    } else if (targetType === 'restaurant') {
      // Only workers can review restaurants
      if (session.user.role !== 'WORKER') {
        return NextResponse.json({ error: 'Only workers can review restaurants' }, { status: 403 });
      }

      // Verify the restaurant exists
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: targetId }
      });

      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }

      // Get worker profile
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (!workerProfile) {
        return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
      }

      // Check if review already exists
      const existingReview = await prisma.reviewRestaurant.findFirst({
        where: {
          restaurantId: targetId,
          workerId: workerProfile.id
        }
      });

      if (existingReview) {
        // Update existing review
        const updatedReview = await prisma.reviewRestaurant.update({
          where: { id: existingReview.id },
          data: { rating, comment, isPublic },
          include: {
            worker: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        });

        return NextResponse.json(updatedReview);
      } else {
        // Create new review
        const newReview = await prisma.reviewRestaurant.create({
          data: {
            rating,
            comment,
            isPublic,
            restaurantId: targetId,
            workerId: workerProfile.id
          },
          include: {
            worker: {
              include: {
                user: { select: { name: true } }
              }
            }
          }
        });

        return NextResponse.json(newReview);
      }
    }

    return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating/updating review:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}