import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TwoFactorAuthService from '@/lib/services/TwoFactorAuthService';
import AuditLogService from '@/lib/services/AuditLogService';

// POST /api/security/2fa/setup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await TwoFactorAuthService.setupTwoFactor(session.user.id);
    
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };
    
    await AuditLogService.log(auditContext, {
      action: 'CREATE',
      resource: 'two_factor_auth',
      resourceId: session.user.id,
      metadata: { event: 'TWO_FACTOR_SETUP_INITIATED' },
    });

    return NextResponse.json({
      secret: result.secret,
      qrCodeUrl: result.qrCodeUrl,
      backupCodes: result.backupCodes,
    });

  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}