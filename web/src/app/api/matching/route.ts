import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobMatchingService } from '@/lib/services/JobMatchingService';

/**
 * Job Matching System Management API
 * 
 * GET /api/matching/stats - Get matching statistics
 * POST /api/matching/recalculate - Bulk recalculate all matches
 */

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners can access system stats
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stats = await JobMatchingService.getMatchingStats();

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching matching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matching statistics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only restaurant owners can trigger bulk operations
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'recalculate_all') {
      // This is a potentially long-running operation
      // In production, you'd want to run this in a background job
      const result = await JobMatchingService.recalculateAllMatches();

      return NextResponse.json({
        success: true,
        message: 'Bulk recalculation completed',
        result
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in matching system API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}