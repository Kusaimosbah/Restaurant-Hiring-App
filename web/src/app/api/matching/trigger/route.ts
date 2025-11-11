import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobMatchingService } from '@/lib/services/JobMatchingService';

/**
 * Job Match Trigger API Endpoint
 * POST /api/matching/trigger - Trigger job matching calculation
 */

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners can trigger matching
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { jobId, workerId, action } = body;

    let result;

    switch (action) {
      case 'find_workers':
        if (!jobId) {
          return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }
        result = await JobMatchingService.findWorkerMatches(jobId, {
          includeInactive: false,
          minScore: 50,
          maxResults: 20
        });
        break;

      case 'find_jobs':
        if (!workerId) {
          return NextResponse.json({ error: 'Worker ID is required' }, { status: 400 });
        }
        result = await JobMatchingService.findJobMatches(workerId, {
          includeInactive: false,
          minScore: 50,
          maxResults: 20
        });
        break;

      case 'recalculate_all':
        result = await JobMatchingService.recalculateAllMatches();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result
    });

  } catch (error) {
    console.error('Error triggering job matching:', error);
    return NextResponse.json(
      { error: 'Failed to trigger job matching' },
      { status: 500 }
    );
  }
}