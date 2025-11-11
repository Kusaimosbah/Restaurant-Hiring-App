import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchService } from '@/lib/services/SearchService';

/**
 * Application Search API Endpoints
 * GET /api/search/applications
 */

const searchService = new SearchService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can search applications' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse search filters from query parameters
    const filters = {
      query: searchParams.get('q') || undefined,
      status: searchParams.getAll('status'),
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined,
      hasInterview: searchParams.get('hasInterview') ? searchParams.get('hasInterview') === 'true' : undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const results = await searchService.searchApplications(filters, session.user.id);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Application search error:', error);
    return NextResponse.json(
      { error: 'Failed to search applications' },
      { status: 500 }
    );
  }
}

/**
 * Get application search suggestions
 * POST /api/search/applications/suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can access application suggestions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const suggestions = await searchService['generateSearchSuggestions']('applications', query);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Application suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}