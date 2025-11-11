import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import RBACService from '@/lib/services/RBACService';
import AuditLogService from '@/lib/services/AuditLogService';

// GET /api/security/roles - Get all available roles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to manage roles
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'read',
      'roles'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roles = await RBACService.getAllRoles();

    return NextResponse.json({ roles });

  } catch (error) {
    console.error('Roles fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/security/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create roles
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'create',
      'roles'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const roleDefinition = await request.json();

    if (!roleDefinition.name || !roleDefinition.permissions) {
      return NextResponse.json({ 
        error: 'Role name and permissions are required' 
      }, { status: 400 });
    }

    await RBACService.createRole(roleDefinition);

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'CREATE',
      resource: 'role',
      resourceId: roleDefinition.name,
      metadata: { permissions: roleDefinition.permissions },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Role created successfully',
      role: roleDefinition.name
    });

  } catch (error) {
    console.error('Role creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// PUT /api/security/roles - Update role permissions
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update roles
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'update',
      'roles'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { roleName, permissions } = await request.json();

    if (!roleName || !permissions) {
      return NextResponse.json({ 
        error: 'Role name and permissions are required' 
      }, { status: 400 });
    }

    await RBACService.updateRole(roleName, permissions);

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'UPDATE',
      resource: 'role',
      resourceId: roleName,
      metadata: { permissions },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Role updated successfully',
      role: roleName
    });

  } catch (error) {
    console.error('Role update error:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/security/roles - Delete role
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete roles
    const hasPermission = await RBACService.hasPermission(
      session.user.id,
      'delete',
      'roles'
    );

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { roleName } = await request.json();

    if (!roleName) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 });
    }

    // Prevent deletion of system roles
    if (['ADMIN', 'EMPLOYER', 'WORKER', 'MODERATOR'].includes(roleName)) {
      return NextResponse.json({ error: 'Cannot delete system roles' }, { status: 400 });
    }

    await RBACService.deleteRole(roleName);

    const auditContext = {
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || undefined,
    };

    await AuditLogService.log(auditContext, {
      action: 'DELETE',
      resource: 'role',
      resourceId: roleName,
      metadata: { deletedRole: roleName },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Role deleted successfully',
      role: roleName
    });

  } catch (error) {
    console.error('Role deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}