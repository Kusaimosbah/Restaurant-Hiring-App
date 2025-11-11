import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GDPRComplianceService from '@/lib/services/GDPRComplianceService';
import AuditLogService from '@/lib/services/AuditLogService';

// DELETE /api/gdpr/delete-account - Delete user account and all data
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason, confirmPassword } = await request.json();

    // In a real implementation, you would verify the password here
    if (!confirmPassword) {
      return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 });
    }

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Log before deletion
    await AuditLogService.log(auditContext, {
      action: 'DELETE',
      resource: 'user_account',
      resourceId: session.user.id,
      metadata: { reason: reason || 'User requested account deletion' },
    });

    await GDPRComplianceService.deleteUserAccount(session.user.id, reason);

    return NextResponse.json({ 
      success: true,
      message: 'Account deletion initiated successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

// POST /api/gdpr/anonymize - Anonymize user data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { confirmPassword } = await request.json();

    // In a real implementation, you would verify the password here
    if (!confirmPassword) {
      return NextResponse.json({ error: 'Password confirmation required' }, { status: 400 });
    }

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Log before anonymization
    await AuditLogService.log(auditContext, {
      action: 'UPDATE',
      resource: 'user_data',
      resourceId: session.user.id,
      metadata: { action: 'anonymization_requested' },
    });

    await GDPRComplianceService.anonymizeUserData(session.user.id);

    return NextResponse.json({ 
      success: true,
      message: 'User data anonymization completed successfully'
    });

  } catch (error) {
    console.error('Data anonymization error:', error);
    return NextResponse.json(
      { error: 'Failed to anonymize user data' },
      { status: 500 }
    );
  }
}