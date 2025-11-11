import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AuditLogService from '@/lib/services/AuditLogService';
import RBACService from '@/lib/services/RBACService';

// GET /api/audit/logs - Get audit logs with pagination and filtering
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
      'audit_logs'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const filters = {
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const logs = await AuditLogService.getLogs(filters, { page, limit });

    return NextResponse.json(logs);

  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// POST /api/audit/export - Export audit logs
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'export',
      'audit_logs'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { filters, format = 'csv' } = await request.json();

    const exportData = await AuditLogService.exportLogs(filters, format);

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'EXPORT',
      resource: 'audit_logs',
      resourceId: 'bulk',
      metadata: { filters, format },
    });

    return new NextResponse(exportData.content, {
      headers: {
        'Content-Type': exportData.contentType,
        'Content-Disposition': `attachment; filename="${exportData.filename}"`,
      },
    });

  } catch (error) {
    console.error('Audit logs export error:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}