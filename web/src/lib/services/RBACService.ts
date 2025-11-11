import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export interface Permission {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

export interface RoleDefinition {
  name: string;
  permissions: Permission[];
  description?: string;
}

export class RBACService {
  private static roleDefinitions: Map<string, RoleDefinition> = new Map();

  /**
   * Initialize default role definitions
   */
  static async initializeRoles(): Promise<void> {
    const defaultRoles: RoleDefinition[] = [
      {
        name: 'ADMIN',
        description: 'System administrator with full access',
        permissions: [
          { action: '*', resource: '*' }, // Full access
        ],
      },
      {
        name: 'EMPLOYER',
        description: 'Restaurant owner/manager',
        permissions: [
          // Job management
          { action: 'create', resource: 'job' },
          { action: 'read', resource: 'job', conditions: { restaurantId: 'user.restaurantId' } },
          { action: 'update', resource: 'job', conditions: { restaurantId: 'user.restaurantId' } },
          { action: 'delete', resource: 'job', conditions: { restaurantId: 'user.restaurantId' } },
          
          // Application management
          { action: 'read', resource: 'application', conditions: { job: { restaurantId: 'user.restaurantId' } } },
          { action: 'update', resource: 'application', conditions: { job: { restaurantId: 'user.restaurantId' } } },
          
          // Profile management
          { action: 'read', resource: 'profile', conditions: { id: 'user.id' } },
          { action: 'update', resource: 'profile', conditions: { id: 'user.id' } },
          
          // Restaurant management
          { action: 'read', resource: 'restaurant', conditions: { id: 'user.restaurantId' } },
          { action: 'update', resource: 'restaurant', conditions: { id: 'user.restaurantId' } },
          
          // Analytics
          { action: 'read', resource: 'analytics', conditions: { restaurantId: 'user.restaurantId' } },
          
          // Messages
          { action: 'create', resource: 'message' },
          { action: 'read', resource: 'message', conditions: { participantId: 'user.id' } },
          
          // Candidates
          { action: 'read', resource: 'candidate', conditions: { appliedToRestaurant: 'user.restaurantId' } },
        ],
      },
      {
        name: 'WORKER',
        description: 'Job seeker/worker',
        permissions: [
          // Job browsing
          { action: 'read', resource: 'job' },
          
          // Application management
          { action: 'create', resource: 'application' },
          { action: 'read', resource: 'application', conditions: { workerId: 'user.id' } },
          { action: 'update', resource: 'application', conditions: { workerId: 'user.id' } },
          
          // Profile management
          { action: 'read', resource: 'profile', conditions: { id: 'user.id' } },
          { action: 'update', resource: 'profile', conditions: { id: 'user.id' } },
          
          // Messages
          { action: 'create', resource: 'message' },
          { action: 'read', resource: 'message', conditions: { participantId: 'user.id' } },
          
          // Search & filtering
          { action: 'create', resource: 'saved_search', conditions: { userId: 'user.id' } },
          { action: 'read', resource: 'saved_search', conditions: { userId: 'user.id' } },
          { action: 'update', resource: 'saved_search', conditions: { userId: 'user.id' } },
          { action: 'delete', resource: 'saved_search', conditions: { userId: 'user.id' } },
        ],
      },
      {
        name: 'MODERATOR',
        description: 'Platform moderator',
        permissions: [
          // Content moderation
          { action: 'read', resource: 'job' },
          { action: 'update', resource: 'job', conditions: { status: 'moderation' } },
          { action: 'read', resource: 'application' },
          { action: 'read', resource: 'message' },
          { action: 'update', resource: 'message', conditions: { flagged: true } },
          
          // User management
          { action: 'read', resource: 'user' },
          { action: 'update', resource: 'user', conditions: { suspended: true } },
          
          // Reports
          { action: 'read', resource: 'report' },
          { action: 'update', resource: 'report' },
        ],
      },
    ];

    // Store role definitions
    for (const role of defaultRoles) {
      this.roleDefinitions.set(role.name, role);
      
      // Store permissions in database
      await this.syncRolePermissions(role.name, role.permissions);
    }
  }

  /**
   * Sync role permissions to database
   */
  private static async syncRolePermissions(roleName: string, permissions: Permission[]): Promise<void> {
    // Remove existing permissions for role
    await prisma.rolePermission.deleteMany({
      where: { roleName },
    });

    // Add new permissions
    for (const permission of permissions) {
      await prisma.rolePermission.create({
        data: {
          roleName,
          permission: permission.action,
          resource: permission.resource,
          conditions: permission.conditions || null,
        },
      });
    }
  }

  /**
   * Check if user has permission
   */
  static async hasPermission(
    userId: string,
    action: string,
    resource: string,
    resourceData?: Record<string, any>
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!user) {
      return false;
    }

    // Get role permissions
    const permissions = await prisma.rolePermission.findMany({
      where: { roleName: user.role as string },
    });

    // Check for matching permissions
    for (const permission of permissions) {
      if (this.matchesPermission(permission, action, resource)) {
        // Check conditions if any
        if (permission.conditions) {
          const conditionsMet = await this.evaluateConditions(
            permission.conditions as Record<string, any>,
            user,
            resourceData
          );
          if (conditionsMet) {
            return true;
          }
        } else {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if permission matches action and resource
   */
  private static matchesPermission(
    permission: { permission: string; resource: string },
    action: string,
    resource: string
  ): boolean {
    const permissionAction = permission.permission;
    const permissionResource = permission.resource;

    // Wildcard permissions
    if (permissionAction === '*' && permissionResource === '*') {
      return true;
    }

    if (permissionAction === '*' && permissionResource === resource) {
      return true;
    }

    if (permissionAction === action && permissionResource === '*') {
      return true;
    }

    return permissionAction === action && permissionResource === resource;
  }

  /**
   * Evaluate permission conditions
   */
  private static async evaluateConditions(
    conditions: Record<string, any>,
    user: any,
    resourceData?: Record<string, any>
  ): Promise<boolean> {
    for (const [key, value] of Object.entries(conditions)) {
      if (typeof value === 'string' && value.startsWith('user.')) {
        const userProperty = value.replace('user.', '');
        const userValue = this.getNestedProperty(user, userProperty);
        const resourceValue = resourceData ? this.getNestedProperty(resourceData, key) : null;
        
        if (userValue !== resourceValue) {
          return false;
        }
      } else if (resourceData) {
        const resourceValue = this.getNestedProperty(resourceData, key);
        if (resourceValue !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get nested property value
   */
  private static getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return [];
    }

    const permissions = await prisma.rolePermission.findMany({
      where: { roleName: user.role as string },
    });

    return permissions.map(p => ({
      action: p.permission,
      resource: p.resource,
      conditions: p.conditions as Record<string, any> || undefined,
    }));
  }

  /**
   * Create custom role
   */
  static async createRole(roleDefinition: RoleDefinition): Promise<void> {
    this.roleDefinitions.set(roleDefinition.name, roleDefinition);
    await this.syncRolePermissions(roleDefinition.name, roleDefinition.permissions);
  }

  /**
   * Update role permissions
   */
  static async updateRole(roleName: string, permissions: Permission[]): Promise<void> {
    const existing = this.roleDefinitions.get(roleName);
    if (existing) {
      existing.permissions = permissions;
      await this.syncRolePermissions(roleName, permissions);
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(roleName: string): Promise<void> {
    this.roleDefinitions.delete(roleName);
    await prisma.rolePermission.deleteMany({
      where: { roleName },
    });
  }

  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<RoleDefinition[]> {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * Middleware for Express routes
   */
  static requirePermission(action: string, resource: string) {
    return async (req: any, res: any, next: any) => {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const hasAccess = await this.hasPermission(
        userId,
        action,
        resource,
        req.body || req.query || req.params
      );

      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: { action, resource }
        });
      }

      next();
    };
  }

  /**
   * Check multiple permissions
   */
  static async hasAnyPermission(
    userId: string,
    permissions: Array<{ action: string; resource: string }>
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasAccess = await this.hasPermission(
        userId,
        permission.action,
        permission.resource
      );
      if (hasAccess) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check all permissions
   */
  static async hasAllPermissions(
    userId: string,
    permissions: Array<{ action: string; resource: string }>
  ): Promise<boolean> {
    for (const permission of permissions) {
      const hasAccess = await this.hasPermission(
        userId,
        permission.action,
        permission.resource
      );
      if (!hasAccess) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get filtered resources based on permissions
   */
  static async filterResources<T extends Record<string, any>>(
    userId: string,
    resources: T[],
    action: string,
    resourceType: string
  ): Promise<T[]> {
    const filtered: T[] = [];

    for (const resource of resources) {
      const hasAccess = await this.hasPermission(
        userId,
        action,
        resourceType,
        resource
      );
      if (hasAccess) {
        filtered.push(resource);
      }
    }

    return filtered;
  }
}

export default RBACService;