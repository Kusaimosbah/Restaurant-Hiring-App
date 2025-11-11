import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RBACService from '@/lib/services/RBACService';
import AuditLogService from '@/lib/services/AuditLogService';

// GET /api/security/permissions - Get user permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const permissions = await RBACService.getUserPermissions(session.user.id);

    return NextResponse.json({ permissions });

  } catch (error) {
    console.error('Permissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    );
  }
}

// POST /api/security/check-permission - Check specific permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, resource, resourceData } = await request.json();

    if (!action || !resource) {
      return NextResponse.json({ error: 'Action and resource are required' }, { status: 400 });
    }

    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      action,
      resource,
      resourceData
    );

    return NextResponse.json({ 
      hasPermission,
      action,
      resource 
    });

  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json(
      { error: 'Failed to check permission' },
      { status: 500 }
    );
  }
}