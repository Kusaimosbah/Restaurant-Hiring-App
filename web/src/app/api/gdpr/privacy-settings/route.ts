import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import GDPRComplianceService from '@/lib/services/GDPRComplianceService';
import AuditLogService from '@/lib/services/AuditLogService';

// GET /api/gdpr/privacy-settings - Get user privacy settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await GDPRComplianceService.getPrivacySettings(session.user.id);

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Privacy settings fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy settings' },
      { status: 500 }
    );
  }
}

// PUT /api/gdpr/privacy-settings - Update user privacy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await request.json();

    await GDPRComplianceService.updatePrivacySettings(session.user.id, settings);

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'UPDATE',
      resource: 'privacy_settings',
      resourceId: session.user.id,
      metadata: { updatedSettings: Object.keys(settings) },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Privacy settings updated successfully'
    });

  } catch (error) {
    console.error('Privacy settings update error:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}

// POST /api/gdpr/consent - Record user consent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { purpose, granted, version } = await request.json();

    if (!purpose || typeof granted !== 'boolean') {
      return NextResponse.json({ error: 'Purpose and granted status are required' }, { status: 400 });
    }

    const consentData = {
      userId: session.user.id,
      purpose,
      granted,
      version: version || '1.0',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      userAgent: request.headers.get('user-agent'),
    };

    if (granted) {
      await GDPRComplianceService.recordConsent(consentData);
    } else {
      await GDPRComplianceService.withdrawConsent(session.user.id, purpose);
    }

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: granted ? 'CREATE' : 'DELETE',
      resource: 'user_consent',
      resourceId: `${session.user.id}-${purpose}`,
      metadata: { purpose, granted, version },
    });

    return NextResponse.json({ 
      success: true,
      message: `Consent ${granted ? 'granted' : 'withdrawn'} successfully`
    });

  } catch (error) {
    console.error('Consent recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    );
  }
}