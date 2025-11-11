import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuditLogService from '@/lib/services/AuditLogService';
import RBACService from '@/lib/services/RBACService';

// GET /api/audit/stats - Get audit statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'read',
      'audit_stats'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const timeRange = searchParams.get('timeRange') || '7d'; // 1d, 7d, 30d, 90d

    const stats = await AuditLogService.getStatistics(timeRange);

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Audit stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit statistics' },
      { status: 500 }
    );
  }
}