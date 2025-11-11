import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GDPRComplianceService from '@/lib/services/GDPRComplianceService';
import AuditLogService from '@/lib/services/AuditLogService';

// POST /api/gdpr/export - Request data export
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format = 'JSON' } = await request.json();

    if (!['JSON', 'CSV', 'PDF'].includes(format)) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    const exportRequest = await GDPRComplianceService.exportUserData(
      session.user.id,
      format as 'JSON' | 'CSV' | 'PDF'
    );

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'CREATE',
      resource: 'data_export',
      resourceId: session.user.id,
      metadata: { format, status: exportRequest.status },
    });

    return NextResponse.json({
      requestId: exportRequest.userId,
      status: exportRequest.status,
      format: exportRequest.format,
      requestedAt: exportRequest.requestedAt,
      downloadUrl: exportRequest.downloadUrl,
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}