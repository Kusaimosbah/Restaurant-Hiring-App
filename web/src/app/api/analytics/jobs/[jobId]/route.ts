import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/AnalyticsService';

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get job analytics
    const jobAnalytics = await AnalyticsService.getJobAnalytics(
      jobId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: jobAnalytics
    });

  } catch (error) {
    console.error('Job analytics API error:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Job not found or access denied') {
        return NextResponse.json(
          { error: 'Job not found or access denied' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch job analytics' },
      { status: 500 }
    );
  }
}