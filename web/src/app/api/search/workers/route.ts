import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchService } from '@/lib/services/SearchService';

/**
 * Worker/Candidate Search API Endpoints
 * GET /api/search/workers
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

    // Both restaurant owners and workers can search workers (for networking, etc.)
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse search filters from query parameters
    const filters = {
      query: searchParams.get('q') || undefined,
      location: searchParams.get('location') || undefined,
      skills: searchParams.getAll('skills'),
      availability: searchParams.getAll('availability'),
      yearsOfExperience: {
        min: searchParams.get('experienceMin') ? parseInt(searchParams.get('experienceMin')!) : undefined,
        max: searchParams.get('experienceMax') ? parseInt(searchParams.get('experienceMax')!) : undefined
      },
      certifications: searchParams.getAll('certifications'),
      languages: searchParams.getAll('languages'),
      transportationMethod: searchParams.getAll('transportationMethod'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    // Clean up empty experience object
    if (!filters.yearsOfExperience.min && !filters.yearsOfExperience.max) {
      delete filters.yearsOfExperience;
    }

    const restaurantOwnerId = session.user.role === 'RESTAURANT_OWNER' ? session.user.id : undefined;
    const results = await searchService.searchWorkers(filters, restaurantOwnerId);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Worker search error:', error);
    return NextResponse.json(
      { error: 'Failed to search workers' },
      { status: 500 }
    );
  }
}

/**
 * Get worker search suggestions
 * POST /api/search/workers/suggestions
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

    const suggestions = await searchService['generateSearchSuggestions']('workers', query);

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Worker suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}