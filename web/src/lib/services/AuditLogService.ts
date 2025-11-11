import { PrismaClient, AuditAction } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditLogEntry {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

export class AuditLogService {
  /**
   * Log an audit event
   */
  static async log(
    context: AuditContext,
    entry: AuditLogEntry
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: context.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues || null,
          newValues: entry.newValues || null,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking main application flow
    }
  }

  /**
   * Log user authentication events
   */
  static async logAuth(
    context: AuditContext,
    action: 'LOGIN' | 'LOGOUT',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(context, {
      action: action as AuditAction,
      resource: 'user',
      resourceId: context.userId,
      metadata,
    });
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    context: AuditContext,
    resource: string,
    resourceId: string,
    action: 'READ' | 'EXPORT' | 'DOWNLOAD' = 'READ',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(context, {
      action: action as AuditAction,
      resource,
      resourceId,
      metadata,
    });
  }

  /**
   * Log data modification events
   */
  static async logDataChange(
    context: AuditContext,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    await this.log(context, {
      action: action as AuditAction,
      resource,
      resourceId,
      oldValues,
      newValues,
    });
  }

  /**
   * Log bulk operations
   */
  static async logBulkOperation(
    context: AuditContext,
    resource: string,
    action: AuditAction,
    count: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(context, {
      action,
      resource,
      metadata: {
        ...metadata,
        bulk: true,
        count,
      },
    });
  }

  /**
   * Get audit logs for a user
   */
  static async getUserAuditLogs(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      actions?: AuditAction[];
      resources?: string[];
    }
  ) {
    const where: any = { userId };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    if (options?.actions?.length) {
      where.action = { in: options.actions };
    }

    if (options?.resources?.length) {
      where.resource = { in: options.resources };
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for a resource
   */
  static async getResourceAuditLogs(
    resource: string,
    resourceId: string,
    options?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const where: any = { resource, resourceId };

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: options?.limit || 100,
      skip: options?.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit statistics
   */
  static async getAuditStats(
    options?: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
    }
  ) {
    const where: any = {};

    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    if (options?.userId) {
      where.userId = options.userId;
    }

    const [
      totalEvents,
      actionStats,
      resourceStats,
      dailyStats,
    ] = await Promise.all([
      // Total count
      prisma.auditLog.count({ where }),

      // Action breakdown
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
      }),

      // Resource breakdown
      prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
        orderBy: { _count: { resource: 'desc' } },
      }),

      // Daily activity (last 30 days)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('day', timestamp) as day,
          COUNT(*) as count
        FROM audit_logs 
        WHERE timestamp >= NOW() - INTERVAL '30 days'
        ${options?.userId ? `AND user_id = ${options.userId}` : ''}
        GROUP BY DATE_TRUNC('day', timestamp)
        ORDER BY day DESC
      `,
    ]);

    return {
      totalEvents,
      actionBreakdown: actionStats.map(stat => ({
        action: stat.action,
        count: stat._count.action,
      })),
      resourceBreakdown: resourceStats.map(stat => ({
        resource: stat.resource,
        count: stat._count.resource,
      })),
      dailyActivity: dailyStats,
    };
  }

  /**
   * Clean up old audit logs
   */
  static async cleanupOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs to CSV
   */
  static async exportAuditLogs(
    options?: {
      startDate?: Date;
      endDate?: Date;
      userId?: string;
      resources?: string[];
      actions?: AuditAction[];
    }
  ): Promise<string> {
    const logs = await this.getUserAuditLogs(
      options?.userId || '',
      {
        limit: 10000, // Max export limit
        startDate: options?.startDate,
        endDate: options?.endDate,
        actions: options?.actions,
        resources: options?.resources,
      }
    );

    // Convert to CSV format
    const headers = [
      'Timestamp',
      'User',
      'Action',
      'Resource',
      'Resource ID',
      'IP Address',
      'User Agent',
    ];

    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.timestamp.toISOString(),
        log.user?.name || 'System',
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress || '',
        `"${log.userAgent || ''}"`,
      ].join(',')),
    ];

    return csvRows.join('\n');
  }

  /**
   * Create audit context from Express request
   */
  static createContextFromRequest(req: Request): AuditContext {
    return {
      userId: (req as any).user?.id,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: req.sessionID,
    };
  }

  /**
   * Middleware to automatically log API requests
   */
  static auditMiddleware() {
    return async (req: Request, res: any, next: any) => {
      const context = this.createContextFromRequest(req);
      
      // Store original res.json to capture response data
      const originalJson = res.json;
      let responseData: any;

      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Log after response is sent
      res.on('finish', async () => {
        // Only log certain endpoints or methods
        if (req.method !== 'GET' && req.url.startsWith('/api/')) {
          const resourceMatch = req.url.match(/\/api\/([^\/]+)/);
          const resource = resourceMatch ? resourceMatch[1] : 'unknown';
          
          let action: AuditAction = 'READ';
          switch (req.method) {
            case 'POST':
              action = 'CREATE';
              break;
            case 'PUT':
            case 'PATCH':
              action = 'UPDATE';
              break;
            case 'DELETE':
              action = 'DELETE';
              break;
          }

          await this.log(context, {
            action,
            resource,
            resourceId: req.params.id,
            newValues: req.body,
            metadata: {
              method: req.method,
              url: req.url,
              statusCode: res.statusCode,
              responseTime: Date.now() - req.startTime,
            },
          });
        }
      });

      next();
    };
  }
}

export default AuditLogService;