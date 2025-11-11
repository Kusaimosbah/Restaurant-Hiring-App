import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TwoFactorAuthService from '@/lib/services/TwoFactorAuthService';
import AuditLogService from '@/lib/services/AuditLogService';

// POST /api/security/2fa/backup-codes - Regenerate backup codes
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required to regenerate backup codes' }, { status: 400 });
    }

    // Verify token before regenerating backup codes
    const verification = await TwoFactorAuthService.verifyTwoFactor(session.user.id, token);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const backupCodes = await TwoFactorAuthService.regenerateBackupCodes(session.user.id);
    
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };
    
    await AuditLogService.log(auditContext, {
      action: 'UPDATE',
      resource: 'two_factor_auth',
      resourceId: session.user.id,
      metadata: { event: 'BACKUP_CODES_REGENERATED' },
    });

    return NextResponse.json({ backupCodes });

  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}