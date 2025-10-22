import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../prisma'
import { Role } from '@prisma/client'

export interface SignupData {
  email: string
  password: string
  name: string
  role: Role
  phone?: string
  businessName?: string
}

export interface SigninData {
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
  emailVerifiedAt?: Date | null
  isVerified: boolean
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret'
  private static readonly ACCESS_TOKEN_EXPIRY = '15m'
  private static readonly REFRESH_TOKEN_EXPIRY = '7d'
  private static readonly MAX_LOGIN_ATTEMPTS = 5
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes in ms

  /**
   * Sign up a new user
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const { email, password, name, role, phone, businessName } = data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create user with transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role,
          phone: phone || null,
          failedLoginCount: 0,
        }
      })

      // Create restaurant profile if role is RESTAURANT_OWNER
      if (role === 'RESTAURANT_OWNER' && businessName) {
        await (tx.restaurant as any).create({
          data: {
            name: businessName,
            ownerId: newUser.id,
          }
        })
      }

      // Create worker profile if role is WORKER
      if (role === 'WORKER') {
        await tx.workerProfile.create({
          data: {
            userId: newUser.id,
            skills: [],
            experience: null, // String field, not number
          }
        })
      }

      // Create email verification token
      await tx.emailVerificationToken.create({
        data: {
          token: verificationToken,
          userId: newUser.id,
          expiresAt: verificationExpiry,
        }
      })

      return newUser
    })

    // Generate tokens
    const tokens = await this.generateTokens(user.id)

    // TODO: Send verification email (will be implemented in email service)
    console.log(`Verification token for ${email}: ${verificationToken}`)

    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }

  /**
   * Sign in user
   */
  static async signin(data: SigninData): Promise<AuthResponse> {
    const { email, password } = data

    // Find user with security fields
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        emailVerifiedAt: true,
        failedLoginCount: true,
        lockedUntil: true,
        restaurant: true,
        workerProfile: true
      }
    })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockoutMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000))
      throw new Error(`Account is locked. Try again in ${lockoutMinutes} minutes.`)
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // Increment failed login count
      const failedCount = (user.failedLoginCount || 0) + 1
      const shouldLock = failedCount >= this.MAX_LOGIN_ATTEMPTS

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil: shouldLock ? new Date(Date.now() + this.LOCKOUT_DURATION) : null
        }
      })

      if (shouldLock) {
        throw new Error('Account has been locked due to too many failed login attempts. Try again in 15 minutes.')
      }

      throw new Error('Invalid email or password')
    }

    // Reset failed login count and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    })

    // Generate tokens
    const tokens = await this.generateTokens(user.id)

    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string, tokenId: string }

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { 
          id: decoded.tokenId,
          userId: decoded.userId
        },
        include: { user: true }
      })

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid refresh token')
      }

      // Some deployments/schema versions may not have a `revoked` boolean field.
      // Compute a runtime revoked flag using available properties (revoked or revokedAt).
      const isRevoked = ((tokenRecord as any).revoked ?? !!(tokenRecord as any).revokedAt) as boolean;
      if (isRevoked) {
        throw new Error('Invalid refresh token')
      }

      // Revoke old refresh token. Build update payload conditionally so TypeScript
      // does not complain when the `revoked` property is missing from the model.
      const updateData: any = { revokedAt: new Date() };
      if ('revoked' in (tokenRecord as any)) updateData.revoked = true;

      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: updateData,
      })

      // Generate new tokens
      return await this.generateTokens(tokenRecord.userId)
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Logout user (revoke refresh token)
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string, tokenId: string }

      // Build update payload conditionally to handle schema variants
      const updateData: any = { revokedAt: new Date() };
      
      // First fetch the record to check if it has the revoked field
      const existingToken = await prisma.refreshToken.findUnique({
        where: { id: decoded.tokenId }
      });
      
      if (existingToken && 'revoked' in (existingToken as any)) {
        updateData.revoked = true;
      }

      await prisma.refreshToken.update({
        where: { 
          id: decoded.tokenId,
          userId: decoded.userId
        },
        data: updateData
      })
    } catch (error) {
      // Silent fail - token might already be invalid
      console.log('Logout error:', error)
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!verificationRecord) {
      throw new Error('Invalid verification token')
    }

    if (verificationRecord.expiresAt < new Date()) {
      throw new Error('Verification token has expired')
    }

    // Check if token is already used (handle schema variants)
    const isUsed = ((verificationRecord as any).used ?? false) as boolean;
    if (isUsed) {
      throw new Error('Verification token has already been used')
    }

    // Update user and mark token as used
    const tokenUpdateData: any = {};
    if ('used' in (verificationRecord as any)) {
      tokenUpdateData.used = true;
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerifiedAt: new Date() }
      }),
      // Only update the token if there are fields to update
      ...(Object.keys(tokenUpdateData).length > 0 ? [
        prisma.emailVerificationToken.update({
          where: { token },
          data: tokenUpdateData
        })
      ] : [])
    ])
  }

  /**
   * Initiate password reset
   */
  static async initiatePasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if email exists - security best practice
      return
    }

    // Revoke any existing password reset tokens (handle schema variants)
    // First get existing tokens to check if they have the 'used' field
    const existingTokens = await prisma.passwordResetToken.findMany({
      where: { 
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    });

    if (existingTokens.length > 0) {
      const sampleToken = existingTokens[0];
      const updateData: any = {};
      
      if ('used' in (sampleToken as any)) {
        updateData.used = true;
        // Only update if the used field exists in the schema
        const whereClause: any = { 
          userId: user.id,
          expiresAt: { gt: new Date() }
        };
        whereClause.used = false;
        
        await prisma.passwordResetToken.updateMany({
          where: whereClause,
          data: updateData
        });
      }
    }

    // Create new reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: resetExpiry,
      }
    })

    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${resetToken}`)
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRecord) {
      throw new Error('Invalid reset token')
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new Error('Reset token has expired')
    }

    // Check if token is already used (handle schema variants)
    const isUsed = ((resetRecord as any).used ?? false) as boolean;
    if (isUsed) {
      throw new Error('Reset token has already been used')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and mark token as used
    const tokenUpdateData: any = {};
    if ('used' in (resetRecord as any)) {
      tokenUpdateData.used = true;
    }

    const transactionOps: any[] = [
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { 
          password: hashedPassword,
          failedLoginCount: 0, // Reset failed attempts
          lockedUntil: null // Remove any lockouts
        }
      })
    ];

    // Only update the token if there are fields to update
    if (Object.keys(tokenUpdateData).length > 0) {
      transactionOps.push(
        prisma.passwordResetToken.update({
          where: { token },
          data: tokenUpdateData
        })
      );
    }

    await prisma.$transaction(transactionOps)
  }

  /**
   * Generate JWT and refresh tokens
   */
  private static async generateTokens(userId: string): Promise<AuthTokens> {
    // Generate access token
    const accessToken = jwt.sign(
      { userId, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    )

    // Generate refresh token string
    const refreshTokenString = crypto.randomBytes(32).toString('hex')

    // Create refresh token record
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    // Generate refresh token JWT (contains reference to database record)
    const refreshToken = jwt.sign(
      { userId, tokenId: refreshTokenRecord.id, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    )

    return {
      accessToken,
      refreshToken
    }
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string, type: string }
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type')
      }

      return { userId: decoded.userId }
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: true,
        workerProfile: true
      }
    })

    return user ? this.sanitizeUser(user) : null
  }

  /**
   * Sanitize user data for client response
   */
  private static sanitizeUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
      isVerified: !!user.emailVerifiedAt
    }
  }

  /**
   * Clean up expired tokens (utility method)
   */
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()
    
    await prisma.$transaction([
      prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: now } }
      }),
      prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } }
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } }
      })
    ])
  }
}