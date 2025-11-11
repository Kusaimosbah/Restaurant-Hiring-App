import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobMatchingService } from '@/lib/services/JobMatchingService';

/**
 * Worker Job Matches API Endpoints
 * 
 * GET /api/workers/[workerId]/matches - Get job matches for a worker
 * POST /api/workers/[workerId]/matches/recalculate - Recalculate matches for a worker
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

    // Workers can only view their own matches, restaurant owners can view any
    if (session.user.role === 'WORKER') {
      // Verify worker is requesting their own matches
      if (session.user.workerProfile?.id !== params.workerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const matches = await JobMatchingService.findJobMatches(params.workerId, {
      minScore,
      maxResults,
      includeInactive
    });

    return NextResponse.json({
      success: true,
      matches,
      count: matches.length
    });

  } catch (error) {
    console.error('Error fetching worker matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worker matches' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Workers can recalculate their own matches, restaurant owners can recalculate any
    if (session.user.role === 'WORKER') {
      if (session.user.workerProfile?.id !== params.workerId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } else if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, criteria = {} } = body;

    if (action === 'recalculate') {
      const matches = await JobMatchingService.findJobMatches(params.workerId, {
        ...criteria,
        recalculateAll: true
      });

      return NextResponse.json({
        success: true,
        message: 'Matches recalculated successfully',
        matches,
        count: matches.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in worker matches API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}