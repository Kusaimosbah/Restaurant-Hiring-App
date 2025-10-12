import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { AuthServiceV2 } from '@/lib/services/authServiceV2'
import { prisma } from '@/lib/prisma'
import { TokenManager } from '@/lib/services/tokenManager'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    restaurant: {
      create: vi.fn(),
    },
    workerProfile: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Mock TokenManager
vi.mock('@/lib/services/tokenManager', () => ({
  TokenManager: {
    checkRateLimit: vi.fn(),
    blacklistToken: vi.fn(),
    isTokenBlacklisted: vi.fn(),
    createUserSession: vi.fn(),
    revokeAllUserSessions: vi.fn(),
  },
}))

describe('AuthServiceV2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks
    TokenManager.checkRateLimit.mockResolvedValue({
      allowed: true,
      remainingAttempts: 4,
      resetTime: Date.now() + 900000
    })
    
    TokenManager.isTokenBlacklisted.mockResolvedValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'Test123!@#',
      name: 'Test User',
      role: 'WORKER' as const,
    }

    it('should create a new user successfully', async () => {
      // Mock user not exists
      prisma.user.findUnique.mockResolvedValue(null)
      
      // Mock transaction
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'WORKER',
        emailVerifiedAt: null,
      }
      
      prisma.$transaction.mockImplementation(async (callback) => {
        const mockTx = {
          user: { create: vi.fn().mockResolvedValue(mockUser) },
          workerProfile: { create: vi.fn() },
          emailVerificationToken: { create: vi.fn() },
        }
        return callback(mockTx)
      })

      // Mock token generation
      prisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const result = await AuthServiceV2.signup(validSignupData)

      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'WORKER',
        emailVerifiedAt: null,
        isVerified: false,
      })
      
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
      expect(TokenManager.createUserSession).toHaveBeenCalled()
    })

    it('should throw error for existing user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      })

      await expect(AuthServiceV2.signup(validSignupData))
        .rejects.toThrow('User already exists with this email')
    })

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validSignupData,
        password: 'weak'
      }

      await expect(AuthServiceV2.signup(weakPasswordData))
        .rejects.toThrow('Password must be at least 8 characters long')
    })

    it('should enforce rate limiting', async () => {
      TokenManager.checkRateLimit.mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        resetTime: Date.now() + 3600000
      })

      await expect(AuthServiceV2.signup(validSignupData))
        .rejects.toThrow('Too many signup attempts')
    })
  })

  describe('signin', () => {
    const validSigninData = {
      email: 'test@example.com',
      password: 'Test123!@#',
    }

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'WORKER',
      password: '$2b$14$hashedpassword',
      emailVerifiedAt: new Date(),
      failedLoginCount: 0,
      lockedUntil: null,
      restaurant: null,
      workerProfile: { id: 'worker-123' },
    }

    it('should sign in user successfully', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      
      // Mock bcrypt compare
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      
      // Mock user update
      prisma.user.update.mockResolvedValue(mockUser)
      
      // Mock token generation
      prisma.refreshToken.create.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const result = await AuthServiceV2.signin(validSigninData)

      expect(result.user.email).toBe('test@example.com')
      expect(result.tokens).toHaveProperty('accessToken')
      expect(result.tokens).toHaveProperty('refreshToken')
    })

    it('should throw error for invalid password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser)
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      
      await expect(AuthServiceV2.signin(validSigninData))
        .rejects.toThrow('Invalid email or password')
    })

    it('should handle account lockout', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 900000) // 15 minutes from now
      }
      
      prisma.user.findUnique.mockResolvedValue(lockedUser)

      await expect(AuthServiceV2.signin(validSigninData))
        .rejects.toThrow('Account is locked')
    })

    it('should enforce rate limiting', async () => {
      TokenManager.checkRateLimit.mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        resetTime: Date.now() + 900000
      })

      await expect(AuthServiceV2.signin(validSigninData))
        .rejects.toThrow('Too many login attempts')
    })
  })

  describe('refreshToken', () => {
    const mockRefreshToken = 'valid.refresh.token'
    const mockTokenPayload = {
      userId: 'user-123',
      tokenId: 'token-123',
      type: 'refresh' as const,
    }

    it('should refresh token successfully', async () => {
      // Mock JWT verify
      vi.spyOn(jwt, 'verify').mockReturnValue(mockTokenPayload as any)
      
      // Mock token not blacklisted
      TokenManager.isTokenBlacklisted.mockResolvedValue(false)
      
      // Mock database token
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-123',
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revoked: false,
        user: { id: 'user-123' },
      })
      
      // Mock token update and creation
      prisma.refreshToken.update.mockResolvedValue({})
      prisma.refreshToken.create.mockResolvedValue({
        id: 'new-token-123',
        token: 'new-refresh-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })

      const result = await AuthServiceV2.refreshToken(mockRefreshToken)

      expect(result).toHaveProperty('accessToken')
      expect(result).toHaveProperty('refreshToken')
      expect(TokenManager.blacklistToken).toHaveBeenCalledWith('token-123', 3600)
    })

    it('should reject blacklisted token', async () => {
      vi.spyOn(jwt, 'verify').mockReturnValue(mockTokenPayload as any)
      TokenManager.isTokenBlacklisted.mockResolvedValue(true)

      await expect(AuthServiceV2.refreshToken(mockRefreshToken))
        .rejects.toThrow('Invalid refresh token')
    })

    it('should reject revoked token', async () => {
      vi.spyOn(jwt, 'verify').mockReturnValue(mockTokenPayload as any)
      TokenManager.isTokenBlacklisted.mockResolvedValue(false)
      
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'token-123',
        revoked: true, // Token is revoked
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { id: 'user-123' },
      })

      await expect(AuthServiceV2.refreshToken(mockRefreshToken))
        .rejects.toThrow('Invalid refresh token')
    })
  })

  describe('logout', () => {
    const mockRefreshToken = 'valid.refresh.token'
    const mockTokenPayload = {
      userId: 'user-123',
      tokenId: 'token-123',
      type: 'refresh' as const,
    }

    it('should logout successfully', async () => {
      vi.spyOn(jwt, 'verify').mockReturnValue(mockTokenPayload as any)
      prisma.refreshToken.update.mockResolvedValue({})

      await AuthServiceV2.logout(mockRefreshToken)

      expect(TokenManager.blacklistToken).toHaveBeenCalledWith('token-123', 3600)
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-123', userId: 'user-123' },
        data: { revoked: true, revokedAt: expect.any(Date) }
      })
    })

    it('should handle invalid token gracefully', async () => {
      vi.spyOn(jwt, 'verify').mockImplementation(() => {
        throw new Error('Invalid token')
      })

      // Should not throw
      await expect(AuthServiceV2.logout(mockRefreshToken)).resolves.not.toThrow()
    })
  })

  describe('verifyAccessToken', () => {
    const mockAccessToken = 'valid.access.token'
    
    it('should verify valid token', async () => {
      const mockPayload = {
        userId: 'user-123',
        tokenId: 'token-123',
        type: 'access' as const,
      }
      
      vi.spyOn(jwt, 'verify').mockReturnValue(mockPayload as any)
      TokenManager.isTokenBlacklisted.mockResolvedValue(false)

      const result = await AuthServiceV2.verifyAccessToken(mockAccessToken)

      expect(result.userId).toBe('user-123')
    })

    it('should reject blacklisted token', async () => {
      const mockPayload = {
        userId: 'user-123',
        tokenId: 'token-123',
        type: 'access' as const,
      }
      
      vi.spyOn(jwt, 'verify').mockReturnValue(mockPayload as any)
      TokenManager.isTokenBlacklisted.mockResolvedValue(true)

      await expect(AuthServiceV2.verifyAccessToken(mockAccessToken))
        .rejects.toThrow('Invalid access token')
    })

    it('should reject non-access token type', async () => {
      const mockPayload = {
        userId: 'user-123',
        tokenId: 'token-123',
        type: 'refresh' as const, // Wrong type
      }
      
      vi.spyOn(jwt, 'verify').mockReturnValue(mockPayload as any)

      await expect(AuthServiceV2.verifyAccessToken(mockAccessToken))
        .rejects.toThrow('Invalid access token')
    })
  })

  describe('password validation', () => {
    const testPasswords = [
      { password: '123', error: 'at least 8 characters' },
      { password: 'lowercase', error: 'uppercase letter' },
      { password: 'UPPERCASE', error: 'lowercase letter' },
      { password: 'NoNumbers!', error: 'number' },
      { password: 'NoSpecial123', error: 'special character' },
      { password: 'ValidPass123!', error: null }, // Valid password
    ]

    testPasswords.forEach(({ password, error }) => {
      it(`should ${error ? 'reject' : 'accept'} password: "${password}"`, async () => {
        const signupData = {
          email: 'test@example.com',
          password,
          name: 'Test User',
          role: 'WORKER' as const,
        }

        if (error) {
          await expect(AuthServiceV2.signup(signupData))
            .rejects.toThrow(error)
        } else {
          // Mock successful signup flow for valid password
          prisma.user.findUnique.mockResolvedValue(null)
          prisma.$transaction.mockImplementation(async (callback) => {
            const mockTx = {
              user: { create: vi.fn().mockResolvedValue({ id: 'user-123', ...signupData }) },
              workerProfile: { create: vi.fn() },
              emailVerificationToken: { create: vi.fn() },
            }
            return callback(mockTx)
          })
          prisma.refreshToken.create.mockResolvedValue({
            id: 'token-123',
            token: 'refresh-token',
            userId: 'user-123',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          })

          const result = await AuthServiceV2.signup(signupData)
          expect(result).toBeDefined()
        }
      })
    })
  })
})