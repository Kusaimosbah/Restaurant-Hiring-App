import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IntegrationService } from '@/lib/services/IntegrationService';

/**
 * Integration Sync API
 * Handles manual sync triggers and sync history
 */

const integrationService = new IntegrationService();

/**
 * Trigger manual sync for integration
 * POST /api/integrations/[id]/sync
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate user role and restaurant ownership
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Only restaurant owners can trigger integrations' },
        { status: 403 }
      );
    }

    const integrationId = params.id;
    const { direction = 'bidirectional' } = await request.json();

    // Verify integration exists and belongs to user's restaurant
    const integration = await integrationService.getIntegration(integrationId);
    
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (integration.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Check if integration is active
    if (integration.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Integration must be active to sync' },
        { status: 400 }
      );
    }

    // Trigger sync
    const syncResult = await integrationService.syncIntegration(
      integrationId,
      direction
    );

    if (!syncResult.success) {
      return NextResponse.json(
        { 
          error: 'Sync failed',
          details: syncResult.error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Sync triggered successfully',
      syncId: syncResult.syncId,
      direction,
      recordsProcessed: syncResult.recordsProcessed,
      errors: syncResult.errors
    });

  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger sync' },
      { status: 500 }
    );
  }
}

/**
 * Get sync history for integration
 * GET /api/integrations/[id]/sync
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const integrationId = params.id;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') as any;

    // Verify integration exists and belongs to user's restaurant
    const integration = await integrationService.getIntegration(integrationId);
    
    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    if (integration.restaurantId !== session.user.restaurantId) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Get sync history
    const syncHistory = await integrationService.getSyncHistory(
      integrationId,
      { page, limit, status }
    );

    return NextResponse.json({
      syncs: syncHistory.syncs,
      pagination: {
        page,
        limit,
        total: syncHistory.total,
        pages: Math.ceil(syncHistory.total / limit)
      },
      stats: {
        totalSyncs: syncHistory.total,
        successfulSyncs: syncHistory.syncs.filter(s => s.status === 'SUCCESS').length,
        failedSyncs: syncHistory.syncs.filter(s => s.status === 'FAILED').length,
        lastSync: syncHistory.syncs[0]?.createdAt
      }
    });

  } catch (error) {
    console.error('Get sync history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}