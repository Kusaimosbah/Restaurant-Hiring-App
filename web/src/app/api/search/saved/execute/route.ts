import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchService } from '@/lib/services/SearchService';

/**
 * Execute Saved Search API Endpoint
 * POST /api/search/saved/execute
 */

const searchService = new SearchService();

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
    const { searchId } = body;

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    const results = await searchService.executeSavedSearch(searchId, session.user.id);

    return NextResponse.json(results);

  } catch (error) {
    console.error('Execute saved search error:', error);
    
    if (error instanceof Error && error.message === 'Saved search not found') {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute saved search' },
      { status: 500 }
    );
  }
}