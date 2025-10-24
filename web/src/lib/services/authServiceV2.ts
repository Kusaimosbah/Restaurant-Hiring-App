import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '../prisma'
import { Role } from '@prisma/client'
import { TokenManager } from './tokenManager'

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
  deviceInfo?: string
  ipAddress?: string
  userAgent?: string
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

export interface TokenPayload {
  userId: string
  tokenId: string
  type: 'access' | 'refresh'
  iat?: number
  exp?: number
}

export class AuthServiceV2 {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-change-in-production'
  private static readonly ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m'
  private static readonly REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d'
  private static readonly MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5')
  private static readonly LOCKOUT_DURATION = parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15') * 60 * 1000

  /**
   * Sign up a new user with enhanced security
   */
  static async signup(data: SignupData): Promise<AuthResponse> {
    const { email, password, name, role, phone, businessName } = data

    // Check rate limiting for signup attempts
    const rateLimitResult = await TokenManager.checkRateLimit(`signup:${email}`, 3, 3600)
    if (!rateLimitResult.allowed) {
      throw new Error('Too many signup attempts. Please try again later.')
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists with this email')
    }

    // Validate password strength
    this.validatePasswordStrength(password)

    // Hash password with high salt rounds
    const saltRounds = 14
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
        await tx.restaurant.create({
          data: {
            name: businessName,
            ownerId: newUser.id,
            // Address will be added later in onboarding
          } as any
        })
      }

      // Create worker profile if role is WORKER
      if (role === 'WORKER') {
        await tx.workerProfile.create({
          data: {
            userId: newUser.id,
            skills: [],
            experience: null,
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
    const tokens = await this.generateTokens(user.id, {
      deviceInfo: data.email, // Temporary until we have device info
      ipAddress: '127.0.0.1', // Will be set by API route
      userAgent: 'unknown' // Will be set by API route
    })

    // TODO: Send verification email (will be implemented in email service)
    console.log(`✉️  Verification token for ${email}: ${verificationToken}`)

    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }

  /**
   * Sign in user with enhanced security and rate limiting
   */
  static async signin(data: SigninData): Promise<AuthResponse> {
    const { email, password, deviceInfo, ipAddress, userAgent } = data

    // Check rate limiting for login attempts
    const rateLimitResult = await TokenManager.checkRateLimit(`login:${email}`, 5, 900)
    if (!rateLimitResult.allowed) {
      const resetTimeMinutes = Math.ceil((rateLimitResult.resetTime - Date.now()) / (60 * 1000))
      throw new Error(`Too many login attempts. Please try again in ${resetTimeMinutes} minutes.`)
    }

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

    // Generate tokens with session tracking
    const tokens = await this.generateTokens(user.id, {
      deviceInfo: deviceInfo || 'unknown',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown'
    })

    return {
      user: this.sanitizeUser(user),
      tokens
    }
  }

  /**
   * Refresh access token with security checks
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload

      // Check if token is blacklisted
      const isBlacklisted = await TokenManager.isTokenBlacklisted(decoded.tokenId)
      if (isBlacklisted) {
        throw new Error('Token has been revoked')
      }

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { 
          id: decoded.tokenId,
          userId: decoded.userId
        },
        include: { user: true }
      })

      // Check if token is expired or revoked (handle schema variants)
      const isRevoked = ((tokenRecord as any).revoked ?? !!(tokenRecord as any).revokedAt) as boolean;
      if (!tokenRecord || tokenRecord.expiresAt < new Date() || isRevoked) {
        throw new Error('Invalid refresh token')
      }

      // Blacklist old refresh token
      await TokenManager.blacklistToken(decoded.tokenId, 3600) // 1 hour blacklist

      // Revoke old refresh token in database (delete since no revoked field)
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id }
      })

      // Generate new tokens
      return await this.generateTokens(tokenRecord.userId, {
        deviceInfo: 'refresh',
        ipAddress: 'refresh',
        userAgent: 'refresh'
      })
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }

  /**
   * Logout user with token blacklisting
   */
  static async logout(refreshToken: string): Promise<void> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as TokenPayload

      // Blacklist the token
      await TokenManager.blacklistToken(decoded.tokenId, 3600) // 1 hour blacklist

      // Revoke refresh token in database
      await prisma.refreshToken.delete({
        where: { 
          id: decoded.tokenId,
          userId: decoded.userId
        }
      })
    } catch (error) {
      // Silent fail - token might already be invalid
      console.log('Logout error (expected for invalid tokens):', error)
    }
  }

  /**
   * Logout from all devices
   */
  static async logoutAllDevices(userId: string): Promise<void> {
    // Revoke all refresh tokens in database
    // Delete all active refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { 
        userId,
        expiresAt: { gt: new Date() }
      }
    })

    // Revoke all Redis sessions
    await TokenManager.revokeAllUserSessions(userId)
  }

  /**
   * Verify access token with blacklist check
   */
  static async verifyAccessToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type')
      }

      // Check if token is blacklisted (for logout scenarios)
      const isBlacklisted = await TokenManager.isTokenBlacklisted(decoded.tokenId || 'unknown')
      if (isBlacklisted) {
        throw new Error('Token has been revoked')
      }

      return { userId: decoded.userId }
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  /**
   * Generate JWT and refresh tokens with session tracking
   */
  private static async generateTokens(
    userId: string, 
    sessionData: { deviceInfo?: string; ipAddress?: string; userAgent?: string }
  ): Promise<AuthTokens> {
    // Generate refresh token string and create database record
    const refreshTokenString = crypto.randomBytes(32).toString('hex')
    
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: refreshTokenString,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }
    })

    // Generate access token with token ID for blacklisting
    const accessToken = (jwt.sign as any)(
      { 
        userId, 
        tokenId: refreshTokenRecord.id, 
        type: 'access' 
      },
      String(this.JWT_SECRET),
      { expiresIn: String(this.ACCESS_TOKEN_EXPIRY) }
    )

    // Generate refresh token JWT
    const refreshToken = (jwt.sign as any)(
      { 
        userId, 
        tokenId: refreshTokenRecord.id, 
        type: 'refresh' 
      },
      String(this.JWT_REFRESH_SECRET),
      { expiresIn: String(this.REFRESH_TOKEN_EXPIRY) }
    )

    // Store session information in Redis
    await TokenManager.createUserSession(userId, {
      tokenId: refreshTokenRecord.id,
      ...sessionData
    })

    return {
      accessToken,
      refreshToken
    }
  }

  /**
   * Validate password strength
   */
  private static validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long')
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter')
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter')
    }
    
    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number')
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character (@$!%*?&)')
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

  // Email verification and password reset methods remain the same
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

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationRecord.userId },
        data: { emailVerifiedAt: new Date() }
      }),
      prisma.emailVerificationToken.delete({
        where: { token }
      })
    ])
  }

  static async initiatePasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) return // Don't reveal if email exists

    // Delete any existing valid reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { 
        userId: user.id,
        expiresAt: { gt: new Date() }
      }
    })

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: resetExpiry,
      }
    })

    console.log(`🔑 Password reset token for ${email}: ${resetToken}`)
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token')
    }

    this.validatePasswordStrength(newPassword)

    const hashedPassword = await bcrypt.hash(newPassword, 14)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { 
          password: hashedPassword,
          failedLoginCount: 0,
          lockedUntil: null
        }
      }),
      prisma.passwordResetToken.delete({
        where: { token }
      })
    ])

    // Logout from all devices for security
    await this.logoutAllDevices(resetRecord.userId)
  }
}