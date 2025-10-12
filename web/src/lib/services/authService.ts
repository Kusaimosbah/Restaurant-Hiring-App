import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../prisma'
import { emailService } from './emailService'

// Define types based on our schema
type Role = 'RESTAURANT_OWNER' | 'WORKER'

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
    const user = await prisma.$transaction(async (tx: any) => {
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
        await tx.restaurant.create({
          data: {
            name: businessName,
            address: '', // Required field, will be updated later
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

    // Find user with related data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
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

      if (!tokenRecord || tokenRecord.expiresAt < new Date() || tokenRecord.revoked) {
        throw new Error('Invalid refresh token')
      }

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
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

      await prisma.refreshToken.update({
        where: { 
          id: decoded.tokenId,
          userId: decoded.userId
        },
        data: { revoked: true }
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

    if (verificationRecord.used) {
      throw new Error('Verification token has already been used')
    }

    // Update user and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerifiedAt: new Date() }
      }),
      prisma.emailVerificationToken.update({
        where: { token },
        data: { used: true }
      })
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

    // Revoke any existing password reset tokens
    await prisma.passwordResetToken.updateMany({
      where: { 
        userId: user.id,
        used: false,
        expiresAt: { gt: new Date() }
      },
      data: { used: true }
    })

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

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken)
      console.log(`✅ Password reset email sent to ${email}`)
    } catch (error) {
      console.error(`❌ Failed to send password reset email to ${email}:`, error)
      // For development, still log the token
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 Password reset token for ${email}: ${resetToken}`)
      }
    }
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

    if (resetRecord.used) {
      throw new Error('Reset token has already been used')
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { 
          password: hashedPassword,
          failedLoginCount: 0, // Reset failed attempts
          lockedUntil: null // Remove any lockouts
        }
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true }
      })
    ])
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