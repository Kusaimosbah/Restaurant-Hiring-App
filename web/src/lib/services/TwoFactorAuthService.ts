import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { addDays, addMinutes } from 'date-fns';

const prisma = new PrismaClient();

export interface TwoFactorSetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  isValid: boolean;
  backupCodeUsed?: boolean;
}

export class TwoFactorAuthService {
  private static readonly BACKUP_CODE_COUNT = 10;
  private static readonly BACKUP_CODE_LENGTH = 8;

  /**
   * Generate 2FA setup data for user
   */
  static async setupTwoFactor(userId: string): Promise<TwoFactorSetupData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate secret key
    const secret = this.generateSecret();
    
    // Generate QR code URL for authenticator apps
    const qrCodeUrl = this.generateQRCodeUrl(user.email, secret);
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 12))
    );

    // Store 2FA data
    await prisma.twoFactorAuth.upsert({
      where: { userId },
      create: {
        userId,
        secret,
        backupCodes: hashedBackupCodes,
        isEnabled: false,
        createdAt: new Date(),
      },
      update: {
        secret,
        backupCodes: hashedBackupCodes,
        isEnabled: false,
        updatedAt: new Date(),
      },
    });

    return {
      secret,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Enable 2FA after user verification
   */
  static async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth) {
      throw new Error('2FA setup not found');
    }

    const isValid = this.verifyToken(twoFactorAuth.secret, token);
    
    if (isValid) {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { 
          isEnabled: true,
          enabledAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Log security event
      await this.logSecurityEvent(userId, 'TWO_FACTOR_ENABLED', {
        timestamp: new Date(),
        success: true,
      });

      return true;
    }

    return false;
  }

  /**
   * Disable 2FA
   */
  static async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      throw new Error('2FA not enabled');
    }

    const verification = await this.verifyTwoFactor(userId, token);
    
    if (verification.isValid) {
      await prisma.twoFactorAuth.update({
        where: { userId },
        data: { 
          isEnabled: false,
          disabledAt: new Date(),
          updatedAt: new Date(),
        }
      });

      // Log security event
      await this.logSecurityEvent(userId, 'TWO_FACTOR_DISABLED', {
        timestamp: new Date(),
        success: true,
      });

      return true;
    }

    return false;
  }

  /**
   * Verify 2FA token or backup code
   */
  static async verifyTwoFactor(userId: string, token: string): Promise<TwoFactorVerification> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth || !twoFactorAuth.isEnabled) {
      return { isValid: false };
    }

    // Try token verification first
    const isTokenValid = this.verifyToken(twoFactorAuth.secret, token);
    
    if (isTokenValid) {
      await this.logSecurityEvent(userId, 'TWO_FACTOR_SUCCESS', {
        method: 'token',
        timestamp: new Date(),
      });
      return { isValid: true };
    }

    // Try backup code verification
    const isBackupCodeValid = await this.verifyBackupCode(userId, token, twoFactorAuth.backupCodes);
    
    if (isBackupCodeValid) {
      await this.logSecurityEvent(userId, 'TWO_FACTOR_SUCCESS', {
        method: 'backup_code',
        timestamp: new Date(),
      });
      return { isValid: true, backupCodeUsed: true };
    }

    // Log failed attempt
    await this.logSecurityEvent(userId, 'TWO_FACTOR_FAILED', {
      timestamp: new Date(),
      token: token.substring(0, 2) + '****',
    });

    return { isValid: false };
  }

  /**
   * Generate new backup codes
   */
  static async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 12))
    );

    await prisma.twoFactorAuth.update({
      where: { userId },
      data: {
        backupCodes: hashedBackupCodes,
        updatedAt: new Date(),
      }
    });

    await this.logSecurityEvent(userId, 'BACKUP_CODES_REGENERATED', {
      timestamp: new Date(),
    });

    return backupCodes;
  }

  /**
   * Get 2FA status for user
   */
  static async getTwoFactorStatus(userId: string): Promise<{
    isEnabled: boolean;
    isSetup: boolean;
    backupCodesCount: number;
  }> {
    const twoFactorAuth = await prisma.twoFactorAuth.findUnique({
      where: { userId }
    });

    if (!twoFactorAuth) {
      return {
        isEnabled: false,
        isSetup: false,
        backupCodesCount: 0,
      };
    }

    return {
      isEnabled: twoFactorAuth.isEnabled,
      isSetup: true,
      backupCodesCount: twoFactorAuth.backupCodes.length,
    };
  }

  // Private helper methods
  private static generateSecret(): string {
    return crypto.randomBytes(20).toString('hex').toUpperCase();
  }

  private static generateQRCodeUrl(email: string, secret: string): string {
    const serviceName = 'Restaurant Hiring';
    const encodedService = encodeURIComponent(serviceName);
    const encodedEmail = encodeURIComponent(email);
    
    return `otpauth://totp/${encodedService}:${encodedEmail}?secret=${secret}&issuer=${encodedService}`;
  }

  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < this.BACKUP_CODE_COUNT; i++) {
      const code = crypto.randomBytes(this.BACKUP_CODE_LENGTH / 2).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  private static verifyToken(secret: string, token: string): boolean {
    // Implementation would use a TOTP library like 'otplib'
    // For now, we'll simulate the verification
    const currentTime = Math.floor(Date.now() / 1000 / 30);
    const tokenWindow = 1; // Allow 1 time step tolerance
    
    for (let i = -tokenWindow; i <= tokenWindow; i++) {
      const timeStep = currentTime + i;
      if (this.generateTOTP(secret, timeStep) === token) {
        return true;
      }
    }
    
    return false;
  }

  private static generateTOTP(secret: string, timeStep: number): string {
    // Simplified TOTP generation - in production use otplib
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(timeStep, 4);
    
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const digest = hmac.digest();
    
    const offset = digest[digest.length - 1] & 0xf;
    const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
    
    return code.toString().padStart(6, '0');
  }

  private static async verifyBackupCode(userId: string, code: string, hashedCodes: string[]): Promise<boolean> {
    for (let i = 0; i < hashedCodes.length; i++) {
      const isMatch = await bcrypt.compare(code, hashedCodes[i]);
      
      if (isMatch) {
        // Remove used backup code
        const updatedCodes = hashedCodes.filter((_, index) => index !== i);
        
        await prisma.twoFactorAuth.update({
          where: { userId },
          data: {
            backupCodes: updatedCodes,
            UpdatedAt: new Date(),
          }
        });
        
        return true;
      }
    }
    
    return false;
  }

  private static async logSecurityEvent(userId: string, event: string, metadata: any): Promise<void> {
    await prisma.securityLog.create({
      data: {
        userId,
        event,
        metadata,
        timestamp: new Date(),
        ipAddress: metadata.ipAddress || 'unknown',
        userAgent: metadata.userAgent || 'unknown',
      }
    });
  }
}

export default TwoFactorAuthService;