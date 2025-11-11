import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobMatchingService } from '@/lib/services/AdvancedJobMatchingService';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/job-matching/recommendations/{workerId}
 * Get job recommendations for a specific worker
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workerId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '10');
    const minScore = parseInt(searchParams.get('minScore') || '60');
    const includeApplied = searchParams.get('includeApplied') === 'true';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean);
    const maxDistance = parseInt(searchParams.get('maxDistance') || '50');

    // Verify worker access
    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check authorization - user can only get their own recommendations or admin can get any
    if (session.user.id !== worker.userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get job recommendations
    const recommendations = await jobMatchingService.getJobRecommendations(workerId, {
      limit,
      minScore,
      includeApplied,
      categories,
      maxDistance,
    });

    // Enrich recommendations with job details
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const job = await prisma.job.findUnique({
          where: { id: rec.jobId },
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
                zipCode: true,
                rating: true,
                logo: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        });

        return {
          ...rec,
          job,
        };
      })
    );

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      total: enrichedRecommendations.length,
      filters: {
        limit,
        minScore,
        includeApplied,
        categories,
        maxDistance,
      },
    });

  } catch (error) {
    console.error('Error getting job recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-matching/recommendations/{workerId}/refresh
 * Refresh and recalculate job recommendations for a worker
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workerId } = params;
    const body = await request.json();

    // Verify worker access
    const worker = await prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    // Check authorization
    if (session.user.id !== worker.userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Clear any cached recommendations (if using caching)
    // await redis.del(`job-recommendations:${workerId}`);

    // Get fresh recommendations
    const recommendations = await jobMatchingService.getJobRecommendations(workerId, {
      limit: body.limit || 10,
      minScore: body.minScore || 60,
      includeApplied: body.includeApplied || false,
      categories: body.categories,
      maxDistance: body.maxDistance || 50,
    });

    // Store refresh timestamp
    await prisma.workerProfile.update({
      where: { id: workerId },
      data: {
        lastRecommendationRefresh: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Recommendations refreshed successfully',
      count: recommendations.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error refreshing job recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}