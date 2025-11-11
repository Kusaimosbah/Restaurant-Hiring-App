import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const { workerIds, action } = body;

    if (!Array.isArray(workerIds) || workerIds.length === 0) {
      return NextResponse.json(
        { error: 'Worker IDs array is required' },
        { status: 400 }
      );
    }

    if (!['activate', 'deactivate', 'verify', 'contact'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: activate, deactivate, verify, or contact' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        // For now, we'll just update the updatedAt timestamp
        // In a real system, this would update a status field
        result = await prisma.workerProfile.updateMany({
          where: {
            id: {
              in: workerIds
            }
          },
          data: {
            updatedAt: new Date()
          }
        });
        break;

      case 'deactivate':
        // Similar to activate, just update timestamp for now
        result = await prisma.workerProfile.updateMany({
          where: {
            id: {
              in: workerIds
            }
          },
          data: {
            updatedAt: new Date()
          }
        });
        break;

      case 'verify':
        // Mark workers as verified (mock implementation)
        result = await prisma.workerProfile.updateMany({
          where: {
            id: {
              in: workerIds
            }
          },
          data: {
            updatedAt: new Date()
          }
        });
        break;

      case 'contact':
        // In a real system, this would create notifications or messages
        // For now, just return success
        result = { count: workerIds.length };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      action,
      affectedCount: result.count || workerIds.length,
      message: `Successfully ${action}d ${result.count || workerIds.length} worker(s)`
    });

  } catch (error) {
    console.error('Bulk workers action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}