import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobMatchingService } from '@/lib/services/JobMatchingService';
import { prisma } from '@/lib/prisma';

/**
 * Job Matches API Endpoint
 * GET /api/matching/matches - Get job matches with filtering options
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const minScore = parseInt(searchParams.get('minScore') || '60');
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const sortBy = searchParams.get('sortBy') || 'overallScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const jobId = searchParams.get('jobId');
    const workerId = searchParams.get('workerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let matches = [];

    if (session.user.role === 'RESTAURANT_OWNER') {
      // Restaurant owners can see matches for their jobs
      if (jobId) {
        // Get matches for a specific job
        matches = await prisma.jobMatch.findMany({
          where: {
            jobId,
            overallScore: { gte: minScore },
            isActive: includeInactive ? undefined : true,
            job: {
              restaurant: {
                ownerId: session.user.id
              }
            }
          },
          include: {
            job: {
              include: {
                restaurant: true
              }
            },
            worker: {
              include: {
                user: true,
                workerSkills: true
              }
            },
            skillMatches: true
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          take: limit
        });
      } else {
        // Get all matches for restaurant's jobs
        matches = await prisma.jobMatch.findMany({
          where: {
            overallScore: { gte: minScore },
            isActive: includeInactive ? undefined : true,
            job: {
              restaurant: {
                ownerId: session.user.id
              }
            }
          },
          include: {
            job: {
              include: {
                restaurant: true
              }
            },
            worker: {
              include: {
                user: true,
                workerSkills: true
              }
            },
            skillMatches: true
          },
          orderBy: {
            [sortBy]: sortOrder
          },
          take: limit
        });
      }
    } else if (session.user.role === 'WORKER') {
      // Workers can only see their own matches
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id }
      });

      if (!workerProfile) {
        return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
      }

      matches = await prisma.jobMatch.findMany({
        where: {
          workerId: workerProfile.id,
          overallScore: { gte: minScore },
          isActive: includeInactive ? undefined : true,
          job: {
            status: 'ACTIVE',
            endDate: { gte: new Date() }
          }
        },
        include: {
          job: {
            include: {
              restaurant: true
            }
          },
          worker: {
            include: {
              user: true,
              workerSkills: true
            }
          },
          skillMatches: true
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        take: limit
      });
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      matches: matches || []
    });

  } catch (error) {
    console.error('Error fetching job matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job matches' },
      { status: 500 }
    );
  }
}