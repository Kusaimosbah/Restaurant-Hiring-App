import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NotificationTriggers } from '@/lib/services/NotificationTriggers';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { applicationIds, action } = body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json(
        { error: 'Application IDs array is required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject', 'interview', 'priority', 'archive', 'restore'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: accept, reject, interview, priority, archive, or restore' },
        { status: 400 }
      );
    }

    // Verify all applications belong to the restaurant owner's jobs
    const applications = await prisma.application.findMany({
      where: {
        id: {
          in: applicationIds
        },
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
            user: true
          }
        }
      }
    });

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: 'Some applications not found or access denied' },
        { status: 404 }
      );
    }

    let result;
    const currentTime = new Date();

    switch (action) {
      case 'accept':
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            status: 'ACCEPTED',
            respondedAt: currentTime
          }
        });
        break;

      case 'reject':
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            status: 'REJECTED',
            respondedAt: currentTime
          }
        });
        break;

      case 'interview':
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            status: 'INTERVIEW_SCHEDULED',
            respondedAt: currentTime
          }
        });
        break;

      case 'priority':
        // For priority, we'd need to implement a priority field in the schema
        // For now, just update the response timestamp to indicate action taken
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            respondedAt: currentTime
          }
        });
        break;

      case 'archive':
        // Archive functionality would require additional schema changes
        // For now, update status to indicate archived
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            status: 'ARCHIVED',
            respondedAt: currentTime
          }
        });
        break;

      case 'restore':
        result = await prisma.application.updateMany({
          where: {
            id: {
              in: applicationIds
            }
          },
          data: {
            status: 'PENDING',
            respondedAt: null
          }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create activity logs for each application (would be implemented with proper logging system)
    const activityLogs = applications.map(app => ({
      applicationId: app.id,
      action,
      performedBy: session.user.id,
      timestamp: currentTime,
      details: `Bulk ${action} performed on application for ${app.job.title}`
    }));

    // Trigger notifications for bulk action
    await NotificationTriggers.onBulkApplicationAction(
      applicationIds,
      action,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      action,
      affectedCount: result.count,
      applications: applications.map(app => ({
        id: app.id,
        jobTitle: app.job.title,
        applicantName: app.worker.user.name,
        newStatus: action === 'accept' ? 'ACCEPTED' : 
                  action === 'reject' ? 'REJECTED' : 
                  action === 'interview' ? 'INTERVIEW_SCHEDULED' : app.status
      })),
      message: `Successfully ${action}ed ${result.count} application(s)`
    });

  } catch (error) {
    console.error('Bulk applications action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}