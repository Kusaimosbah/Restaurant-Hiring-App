import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TwoFactorAuthService from '@/lib/services/TwoFactorAuthService';
import AuditLogService from '@/lib/services/AuditLogService';

// POST /api/security/2fa/verify
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const verification = await TwoFactorAuthService.verifyTwoFactor(session.user.id, token);
    
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };
    
    if (verification.isValid) {
      await AuditLogService.log(auditContext, {
        action: 'UPDATE',
        resource: 'two_factor_auth',
        resourceId: session.user.id,
        metadata: { 
          event: 'TWO_FACTOR_VERIFIED',
          backupCodeUsed: verification.backupCodeUsed,
        },
      });

      return NextResponse.json({ 
        valid: true,
        backupCodeUsed: verification.backupCodeUsed 
      });
    } else {
      await AuditLogService.log(auditContext, {
        action: 'READ',
        resource: 'two_factor_auth',
        resourceId: session.user.id,
        metadata: { 
          event: 'TWO_FACTOR_VERIFY_FAILED',
          reason: 'Invalid token',
        },
      });

      return NextResponse.json({ valid: false }, { status: 400 });
    }

  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA token' },
      { status: 500 }
    );
  }
}