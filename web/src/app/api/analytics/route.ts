import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsService } from '@/lib/services/AnalyticsService';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'overview';

    // Default date range (last 30 days)
    const defaultDateRange = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date()
    };

    const dateRange = {
      from: from ? new Date(from) : defaultDateRange.from,
      to: to ? new Date(to) : defaultDateRange.to
    };

    // Validate date range
    if (isNaN(dateRange.from.getTime()) || isNaN(dateRange.to.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      );
    }

    if (dateRange.from > dateRange.to) {
      return NextResponse.json(
        { error: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    // Get analytics based on type
    switch (type) {
      case 'overview':
        const metrics = await AnalyticsService.getComprehensiveMetrics(
          session.user.id,
          dateRange
        );
        return NextResponse.json({
          success: true,
          data: metrics,
          dateRange
        });

      case 'workers':
        const workerAnalytics = await AnalyticsService.getWorkerAnalytics(
          session.user.id,
          dateRange
        );
        return NextResponse.json({
          success: true,
          data: workerAnalytics,
          dateRange
        });

      default:
        return NextResponse.json(
          { error: 'Invalid analytics type' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === 'Restaurant not found') {
        return NextResponse.json(
          { error: 'Restaurant not found or access denied' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}