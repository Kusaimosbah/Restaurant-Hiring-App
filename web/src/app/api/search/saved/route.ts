import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchService } from '@/lib/services/SearchService';

/**
 * Saved Searches API Endpoints
 * Handles CRUD operations for saved searches
 */

const searchService = new SearchService();

/**
 * Get all saved searches for the authenticated user
 * GET /api/search/saved
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

    const savedSearches = await searchService.getSavedSearches(session.user.id);

    return NextResponse.json({ savedSearches });

  } catch (error) {
    console.error('Get saved searches error:', error);
    return NextResponse.json(
      { error: 'Failed to get saved searches' },
      { status: 500 }
    );
  }
}

/**
 * Create a new saved search
 * POST /api/search/saved
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
    const {
      name,
      description,
      filters,
      searchType,
      alertsEnabled = false
    } = body;

    // Validate required fields
    if (!name || !filters || !searchType) {
      return NextResponse.json(
        { error: 'Name, filters, and searchType are required' },
        { status: 400 }
      );
    }

    // Validate searchType
    if (!['jobs', 'applications', 'workers'].includes(searchType)) {
      return NextResponse.json(
        { error: 'Invalid search type' },
        { status: 400 }
      );
    }

    const savedSearch = await searchService.saveSearch({
      name,
      description,
      filters,
      searchType,
      userId: session.user.id,
      isActive: true,
      alertsEnabled
    });

    return NextResponse.json({ savedSearch });

  } catch (error) {
    console.error('Save search error:', error);
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    );
  }
}

/**
 * Update a saved search
 * PUT /api/search/saved
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    const updatedSearch = await searchService.updateSavedSearch(
      id,
      updates,
      session.user.id
    );

    return NextResponse.json({ savedSearch: updatedSearch });

  } catch (error) {
    console.error('Update saved search error:', error);
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    );
  }
}

/**
 * Delete a saved search
 * DELETE /api/search/saved
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchId = url.searchParams.get('id');

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      );
    }

    await searchService.deleteSavedSearch(searchId, session.user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete saved search error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    );
  }
}