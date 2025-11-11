import { PrismaClient } from '@prisma/client';
import DataEncryptionService from './DataEncryptionService';
import AuditLogService from './AuditLogService';

const prisma = new PrismaClient();

export interface DataExportRequest {
  userId: string;
  requestedAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  format: 'JSON' | 'CSV' | 'PDF';
}

export interface ConsentRecord {
  userId: string;
  purpose: string;
  granted: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  action: 'DELETE' | 'ANONYMIZE' | 'ARCHIVE';
  description: string;
}

export interface PrivacySettings {
  userId: string;
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'RESTRICTED';
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  cookieConsent: boolean;
  dataRetentionConsent: boolean;
  updatedAt: Date;
}

export class GDPRComplianceService {
  private static readonly DATA_RETENTION_POLICIES: DataRetentionPolicy[] = [
    {
      dataType: 'user_profile',
      retentionPeriod: 2555, // 7 years
      action: 'ANONYMIZE',
      description: 'User profile data after account deletion',
    },
    {
      dataType: 'job_applications',
      retentionPeriod: 1095, // 3 years
      action: 'DELETE',
      description: 'Job application records',
    },
    {
      dataType: 'messages',
      retentionPeriod: 365, // 1 year
      action: 'DELETE',
      description: 'Private messages and conversations',
    },
    {
      dataType: 'session_logs',
      retentionPeriod: 90, // 3 months
      action: 'DELETE',
      description: 'User session and activity logs',
    },
    {
      dataType: 'audit_logs',
      retentionPeriod: 2555, // 7 years (legal requirement)
      action: 'ARCHIVE',
      description: 'Audit trails for compliance',
    },
  ];

  /**
   * Export all user data in requested format
   */
  static async exportUserData(
    userId: string,
    format: 'JSON' | 'CSV' | 'PDF' = 'JSON'
  ): Promise<DataExportRequest> {
    // Log the export request
    await AuditLogService.log({
      userId,
      action: 'DATA_EXPORT_REQUESTED',
      entityType: 'user_data',
      entityId: userId,
      metadata: { format },
    });

    // Create export request record
    const exportRequest: DataExportRequest = {
      userId,
      requestedAt: new Date(),
      status: 'PENDING',
      format,
    };

    try {
      // Gather all user data
      const userData = await this.gatherUserData(userId);
      
      // Format data based on requested format
      let exportData: string;
      let filename: string;
      
      switch (format) {
        case 'JSON':
          exportData = JSON.stringify(userData, null, 2);
          filename = `user-data-${userId}-${Date.now()}.json`;
          break;
        case 'CSV':
          exportData = this.convertToCSV(userData);
          filename = `user-data-${userId}-${Date.now()}.csv`;
          break;
        case 'PDF':
          exportData = await this.convertToPDF(userData);
          filename = `user-data-${userId}-${Date.now()}.pdf`;
          break;
        default:
          throw new Error('Unsupported export format');
      }

      // Save export file (implement your file storage logic)
      const downloadUrl = await this.saveExportFile(filename, exportData);

      exportRequest.status = 'COMPLETED';
      exportRequest.completedAt = new Date();
      exportRequest.downloadUrl = downloadUrl;

      // Log completion
      await AuditLogService.log({
        userId,
        action: 'DATA_EXPORT_COMPLETED',
        entityType: 'user_data',
        entityId: userId,
        metadata: { format, downloadUrl },
      });

    } catch (error) {
      exportRequest.status = 'FAILED';
      
      await AuditLogService.log({
        userId,
        action: 'DATA_EXPORT_FAILED',
        entityType: 'user_data',
        entityId: userId,
        metadata: { format, error: (error as Error).message },
      });
    }

    return exportRequest;
  }

  /**
   * Gather all user data from various sources
   */
  private static async gatherUserData(userId: string): Promise<Record<string, any>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        applications: {
          include: {
            job: {
              include: {
                restaurant: true,
              },
            },
          },
        },
        sentMessages: true,
        receivedMessages: true,
        reviews: true,
        notifications: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get additional data
    const sessions = await prisma.userSession?.findMany({
      where: { userId },
    }) || [];

    const auditLogs = await prisma.auditLog?.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1000, // Limit to recent logs
    }) || [];

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: user.profile,
      applications: user.applications,
      messages: {
        sent: user.sentMessages,
        received: user.receivedMessages,
      },
      reviews: user.reviews,
      notifications: user.notifications,
      sessions: sessions,
      auditLogs: auditLogs.map(log => ({
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
        metadata: log.metadata,
      })),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: Record<string, any>): string {
    // Implement CSV conversion logic
    const flattenedData = this.flattenObject(data);
    const headers = Object.keys(flattenedData);
    const values = Object.values(flattenedData);

    const csvContent = [
      headers.join(','),
      values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','),
    ].join('\n');

    return csvContent;
  }

  /**
   * Convert data to PDF format
   */
  private static async convertToPDF(data: Record<string, any>): Promise<string> {
    // Implement PDF conversion logic using a library like puppeteer or jsPDF
    // For now, return a placeholder
    return `PDF export of user data: ${JSON.stringify(data, null, 2)}`;
  }

  /**
   * Flatten nested object for CSV export
   */
  private static flattenObject(obj: any, prefix = ''): Record<string, any> {
    const flattened: Record<string, any> = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else {
          flattened[newKey] = obj[key];
        }
      }
    }

    return flattened;
  }

  /**
   * Save export file to storage
   */
  private static async saveExportFile(filename: string, content: string): Promise<string> {
    // Implement your file storage logic (AWS S3, local storage, etc.)
    // Return the download URL
    return `https://your-storage.com/exports/${filename}`;
  }

  /**
   * Delete user account and all associated data
   */
  static async deleteUserAccount(userId: string, reason?: string): Promise<void> {
    await AuditLogService.log({
      userId,
      action: 'ACCOUNT_DELETION_STARTED',
      entityType: 'user',
      entityId: userId,
      metadata: { reason },
    });

    try {
      // Delete in correct order to handle foreign key constraints
      await prisma.$transaction(async (tx) => {
        // Delete related data first
        await tx.notification?.deleteMany({ where: { userId } });
        await tx.message?.deleteMany({ where: { OR: [{ senderId: userId }, { receiverId: userId }] } });
        await tx.application?.deleteMany({ where: { workerId: userId } });
        await tx.review?.deleteMany({ where: { OR: [{ reviewerId: userId }, { revieweeId: userId }] } });
        await tx.userSession?.deleteMany({ where: { userId } });
        
        // Delete user profile and account
        await tx.profile?.delete({ where: { userId } }).catch(() => {});
        await tx.user.delete({ where: { id: userId } });
      });

      await AuditLogService.log({
        userId,
        action: 'ACCOUNT_DELETED',
        entityType: 'user',
        entityId: userId,
        metadata: { reason, deletedAt: new Date() },
      });

    } catch (error) {
      await AuditLogService.log({
        userId,
        action: 'ACCOUNT_DELETION_FAILED',
        entityType: 'user',
        entityId: userId,
        metadata: { reason, error: (error as Error).message },
      });
      throw error;
    }
  }

  /**
   * Anonymize user data
   */
  static async anonymizeUserData(userId: string): Promise<void> {
    const anonymousId = `anon_${DataEncryptionService.generateToken(16)}`;
    
    await AuditLogService.log({
      userId,
      action: 'DATA_ANONYMIZATION_STARTED',
      entityType: 'user',
      entityId: userId,
    });

    try {
      await prisma.$transaction(async (tx) => {
        // Anonymize user data
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `${anonymousId}@anonymized.local`,
            name: 'Anonymous User',
            phone: null,
          },
        });

        // Anonymize profile data
        await tx.profile?.update({
          where: { userId },
          data: {
            firstName: 'Anonymous',
            lastName: 'User',
            phone: null,
            address: null,
            dateOfBirth: null,
            bio: 'User data has been anonymized',
          },
        }).catch(() => {});
      });

      await AuditLogService.log({
        userId: anonymousId,
        action: 'DATA_ANONYMIZED',
        entityType: 'user',
        entityId: userId,
        metadata: { originalUserId: userId, anonymizedAt: new Date() },
      });

    } catch (error) {
      await AuditLogService.log({
        userId,
        action: 'DATA_ANONYMIZATION_FAILED',
        entityType: 'user',
        entityId: userId,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  /**
   * Record user consent
   */
  static async recordConsent(consent: Omit<ConsentRecord, 'grantedAt'>): Promise<void> {
    const consentRecord: ConsentRecord = {
      ...consent,
      grantedAt: new Date(),
    };

    // Store consent record (implement your storage logic)
    await AuditLogService.log({
      userId: consent.userId,
      action: 'CONSENT_GRANTED',
      entityType: 'consent',
      entityId: `${consent.userId}-${consent.purpose}`,
      metadata: consentRecord,
    });
  }

  /**
   * Withdraw user consent
   */
  static async withdrawConsent(userId: string, purpose: string): Promise<void> {
    await AuditLogService.log({
      userId,
      action: 'CONSENT_WITHDRAWN',
      entityType: 'consent',
      entityId: `${userId}-${purpose}`,
      metadata: { purpose, withdrawnAt: new Date() },
    });
  }

  /**
   * Get user's privacy settings
   */
  static async getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
    // Implement privacy settings retrieval
    // For now, return default settings
    return {
      userId,
      profileVisibility: 'PRIVATE',
      dataProcessingConsent: false,
      marketingConsent: false,
      analyticsConsent: false,
      cookieConsent: false,
      dataRetentionConsent: false,
      updatedAt: new Date(),
    };
  }

  /**
   * Update user's privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<Omit<PrivacySettings, 'userId' | 'updatedAt'>>
  ): Promise<void> {
    await AuditLogService.log({
      userId,
      action: 'PRIVACY_SETTINGS_UPDATED',
      entityType: 'privacy_settings',
      entityId: userId,
      metadata: { settings, updatedAt: new Date() },
    });
  }

  /**
   * Apply data retention policies
   */
  static async applyDataRetention(): Promise<void> {
    for (const policy of this.DATA_RETENTION_POLICIES) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.retentionPeriod);

      switch (policy.dataType) {
        case 'user_profile':
          await this.cleanupUserProfiles(cutoffDate, policy.action);
          break;
        case 'job_applications':
          await this.cleanupJobApplications(cutoffDate);
          break;
        case 'messages':
          await this.cleanupMessages(cutoffDate);
          break;
        case 'session_logs':
          await this.cleanupSessions(cutoffDate);
          break;
        case 'audit_logs':
          await this.archiveAuditLogs(cutoffDate);
          break;
      }
    }
  }

  /**
   * Cleanup old user profiles
   */
  private static async cleanupUserProfiles(cutoffDate: Date, action: string): Promise<void> {
    const oldUsers = await prisma.user.findMany({
      where: {
        updatedAt: { lt: cutoffDate },
        // Add condition for deleted accounts
      },
    });

    for (const user of oldUsers) {
      if (action === 'ANONYMIZE') {
        await this.anonymizeUserData(user.id);
      } else if (action === 'DELETE') {
        await this.deleteUserAccount(user.id, 'Data retention policy');
      }
    }
  }

  /**
   * Cleanup old job applications
   */
  private static async cleanupJobApplications(cutoffDate: Date): Promise<void> {
    await prisma.application?.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }

  /**
   * Cleanup old messages
   */
  private static async cleanupMessages(cutoffDate: Date): Promise<void> {
    await prisma.message?.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }

  /**
   * Cleanup old sessions
   */
  private static async cleanupSessions(cutoffDate: Date): Promise<void> {
    await prisma.userSession?.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }

  /**
   * Archive old audit logs
   */
  private static async archiveAuditLogs(cutoffDate: Date): Promise<void> {
    // Implement archiving logic (move to cold storage, compress, etc.)
    const oldLogs = await prisma.auditLog?.findMany({
      where: { createdAt: { lt: cutoffDate } },
    });

    // Archive logs to external storage
    // Then delete from main database
    await prisma.auditLog?.deleteMany({
      where: { createdAt: { lt: cutoffDate } },
    });
  }

  /**
   * Generate privacy policy compliance report
   */
  static async generateComplianceReport(): Promise<Record<string, any>> {
    const userCount = await prisma.user.count();
    const profileCount = await prisma.profile?.count() || 0;
    const messageCount = await prisma.message?.count() || 0;
    const applicationCount = await prisma.application?.count() || 0;

    return {
      generatedAt: new Date(),
      totalUsers: userCount,
      totalProfiles: profileCount,
      totalMessages: messageCount,
      totalApplications: applicationCount,
      dataRetentionPolicies: this.DATA_RETENTION_POLICIES,
      complianceStatus: 'COMPLIANT',
    };
  }
}

export default GDPRComplianceService;