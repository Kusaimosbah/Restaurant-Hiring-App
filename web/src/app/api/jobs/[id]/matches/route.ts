import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobMatchingService } from '@/lib/services/JobMatchingService';

/**
 * Job Matching API Endpoints
 * 
 * GET /api/jobs/[jobId]/matches - Get worker matches for a job
 * POST /api/jobs/[jobId]/matches/recalculate - Recalculate matches for a job
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

    // Only restaurant owners can view job matches
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const minScore = parseInt(searchParams.get('minScore') || '0');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const matches = await JobMatchingService.findWorkerMatches(params.jobId, {
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
    console.error('Error fetching job matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job matches' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners can recalculate matches
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action, criteria = {} } = body;

    if (action === 'recalculate') {
      const matches = await JobMatchingService.findWorkerMatches(params.jobId, {
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
    console.error('Error in job matches API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}