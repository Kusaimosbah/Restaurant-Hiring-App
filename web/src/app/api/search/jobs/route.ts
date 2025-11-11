import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchService } from '@/lib/services/SearchService';

/**
 * Advanced Search API Endpoints
 * Handles search requests for jobs, applications, and workers
 */

const searchService = new SearchService();

/**
 * Search for jobs
 * GET /api/search/jobs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse search filters from query parameters
    const filters = {
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      workType: searchParams.getAll('workType'),
      experienceLevel: searchParams.getAll('experienceLevel'),
      salaryMin: searchParams.get('salaryMin') ? parseFloat(searchParams.get('salaryMin')!) : undefined,
      salaryMax: searchParams.get('salaryMax') ? parseFloat(searchParams.get('salaryMax')!) : undefined,
      schedule: searchParams.getAll('schedule'),
      benefits: searchParams.getAll('benefits'),
      urgency: searchParams.get('urgency') as 'LOW' | 'MEDIUM' | 'HIGH' | undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const results = await searchService.searchJobs(filters, session.user.id);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Job search error:', error);
    return NextResponse.json(
      { error: 'Failed to search jobs' },
      { status: 500 }
    );
  }
}

/**
 * Get search suggestions
 * GET /api/search/jobs/suggestions?q=cook
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

    const body = await request.json();
    const { query } = body;

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Generate suggestions based on existing job data
    const suggestions = await searchService['generateSearchSuggestions']('jobs', query);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}