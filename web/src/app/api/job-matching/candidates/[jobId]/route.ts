import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { jobMatchingService } from '@/lib/services/AdvancedJobMatchingService';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/job-matching/candidates/{jobId}
 * Get worker candidates for a specific job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '20');
    const minScore = parseInt(searchParams.get('minScore') || '50');
    const excludeApplied = searchParams.get('excludeApplied') !== 'false';
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    // Verify job access
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization - only job creator or admin can get candidates
    if (
      session.user.id !== job.restaurant.owner.id && 
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get worker candidates
    const candidates = await jobMatchingService.getWorkerRecommendations(jobId, {
      limit,
      minScore,
      excludeApplied,
      activeOnly,
    });

    // Enrich candidates with worker details
    const enrichedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        const worker = await prisma.workerProfile.findUnique({
          where: { id: candidate.workerId },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                createdAt: true,
                lastLoginAt: true,
              },
            },
            workerSkills: {
              include: {
                skill: true,
              },
            },
            reviewsFromRestaurants: {
              take: 5,
              orderBy: {
                createdAt: 'desc',
              },
              include: {
                restaurant: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            certifications: true,
            _count: {
              select: {
                applications: true,
              },
            },
          },
        });

        return {
          ...candidate,
          worker,
        };
      })
    );

    return NextResponse.json({
      candidates: enrichedCandidates,
      total: enrichedCandidates.length,
      job: {
        id: job.id,
        title: job.title,
        restaurant: {
          id: job.restaurant.id,
          name: job.restaurant.name,
        },
      },
      filters: {
        limit,
        minScore,
        excludeApplied,
        activeOnly,
      },
    });

  } catch (error) {
    console.error('Error getting worker candidates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/job-matching/candidates/{jobId}/invite
 * Invite specific workers to apply for a job
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = params;
    const body = await request.json();
    const { workerIds, message } = body;

    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json(
        { error: 'Worker IDs array is required' },
        { status: 400 }
      );
    }

    // Verify job access
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Check authorization
    if (
      session.user.id !== job.restaurant.owner.id && 
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify all workers exist
    const workers = await prisma.workerProfile.findMany({
      where: {
        id: { in: workerIds },
      },
      include: {
        user: true,
      },
    });

    if (workers.length !== workerIds.length) {
      return NextResponse.json(
        { error: 'Some workers not found' },
        { status: 404 }
      );
    }

    // Create job invitations
    const invitations = await Promise.all(
      workers.map(async (worker) => {
        // Check if already invited or applied
        const existingApplication = await prisma.application.findFirst({
          where: {
            jobId,
            workerId: worker.id,
          },
        });

        const existingInvitation = await prisma.jobInvitation.findFirst({
          where: {
            jobId,
            workerId: worker.id,
          },
        });

        if (existingApplication || existingInvitation) {
          return {
            workerId: worker.id,
            status: 'already_exists',
            message: existingApplication ? 'Already applied' : 'Already invited',
          };
        }

        // Create invitation
        const invitation = await prisma.jobInvitation.create({
          data: {
            jobId,
            workerId: worker.id,
            restaurantId: job.restaurantId,
            message: message || `You've been invited to apply for ${job.title} at ${job.restaurant.name}`,
            status: 'PENDING',
          },
        });

        // Create notification
        await prisma.notification.create({
          data: {
            userId: worker.userId,
            type: 'JOB_INVITATION',
            title: 'New Job Invitation',
            message: `${job.restaurant.name} has invited you to apply for ${job.title}`,
            data: {
              jobId,
              restaurantId: job.restaurantId,
              invitationId: invitation.id,
            },
          },
        });

        return {
          workerId: worker.id,
          status: 'invited',
          invitationId: invitation.id,
        };
      })
    );

    // Send email notifications (implement email service)
    // await emailService.sendJobInvitations(workers, job, message);

    return NextResponse.json({
      message: 'Job invitations sent successfully',
      invitations,
      totalSent: invitations.filter(inv => inv.status === 'invited').length,
      totalSkipped: invitations.filter(inv => inv.status === 'already_exists').length,
    });

  } catch (error) {
    console.error('Error sending job invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}