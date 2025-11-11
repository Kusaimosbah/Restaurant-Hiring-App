import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TwoFactorAuthService from '@/lib/services/TwoFactorAuthService';
import AuditLogService from '@/lib/services/AuditLogService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/security/2fa/disable
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required to disable 2FA' }, { status: 400 });
    }

    // Verify token before disabling
    const verification = await TwoFactorAuthService.verifyTwoFactor(session.user.id, token);
    if (!verification.isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    await TwoFactorAuthService.disableTwoFactor(session.user.id, token);
    
    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };
    
    await AuditLogService.log(auditContext, {
      action: 'UPDATE',
      resource: 'two_factor_auth',
      resourceId: session.user.id,
      metadata: { event: 'TWO_FACTOR_DISABLED' },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

// GET /api/security/2fa/status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId: session.user.id }
    });
    
    const isEnabled = twoFactorAuth?.isEnabled || false;
    
    return NextResponse.json({ enabled: isEnabled });

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}