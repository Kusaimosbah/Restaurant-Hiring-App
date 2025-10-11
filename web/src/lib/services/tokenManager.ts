import Redis from 'ioredis'

// Redis client for token blacklisting and session management
let redis: Redis | null = null

const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl, {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: 1,
    })

    redis.on('error', (error) => {
      console.error('Redis connection error:', error)
    })
  }
  return redis
}

export class TokenManager {
  private static readonly TOKEN_BLACKLIST_PREFIX = 'blacklist:token:'
  private static readonly USER_SESSION_PREFIX = 'session:user:'
  private static readonly RATE_LIMIT_PREFIX = 'rate_limit:'

  /**
   * Blacklist a token (for logout or revocation)
   */
  static async blacklistToken(tokenId: string, expiresInSeconds: number): Promise<void> {
    try {
      const client = getRedisClient()
      await client.setex(
        `${this.TOKEN_BLACKLIST_PREFIX}${tokenId}`,
        expiresInSeconds,
        'blacklisted'
      )
    } catch (error) {
      console.error('Redis blacklist error:', error)
      // Continue without Redis if it fails
    }
  }

  /**
   * Check if a token is blacklisted
   */
  static async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const client = getRedisClient()
      const result = await client.get(`${this.TOKEN_BLACKLIST_PREFIX}${tokenId}`)
      return result !== null
    } catch (error) {
      console.error('Redis blacklist check error:', error)
      // Fail open - allow access if Redis is down
      return false
    }
  }

  /**
   * Store user session information
   */
  static async createUserSession(
    userId: string, 
    sessionData: { 
      tokenId: string
      deviceInfo?: string
      ipAddress?: string
      userAgent?: string
    }
  ): Promise<void> {
    try {
      const client = getRedisClient()
      const sessionKey = `${this.USER_SESSION_PREFIX}${userId}:${sessionData.tokenId}`
      
      await client.setex(
        sessionKey,
        7 * 24 * 60 * 60, // 7 days
        JSON.stringify({
          ...sessionData,
          createdAt: new Date().toISOString(),
        })
      )
    } catch (error) {
      console.error('Redis session creation error:', error)
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<any[]> {
    try {
      const client = getRedisClient()
      const pattern = `${this.USER_SESSION_PREFIX}${userId}:*`
      const keys = await client.keys(pattern)
      
      if (keys.length === 0) return []
      
      const sessions = await client.mget(keys)
      return sessions
        .filter(session => session !== null)
        .map(session => JSON.parse(session!))
    } catch (error) {
      console.error('Redis session retrieval error:', error)
      return []
    }
  }

  /**
   * Revoke all sessions for a user (force logout all devices)
   */
  static async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      const client = getRedisClient()
      const pattern = `${this.USER_SESSION_PREFIX}${userId}:*`
      const keys = await client.keys(pattern)
      
      if (keys.length > 0) {
        await client.del(...keys)
      }
    } catch (error) {
      console.error('Redis session revocation error:', error)
    }
  }

  /**
   * Rate limiting for authentication endpoints
   */
  static async checkRateLimit(
    identifier: string, // IP address or user ID
    maxAttempts: number = 5,
    windowSeconds: number = 900 // 15 minutes
  ): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: number }> {
    try {
      const client = getRedisClient()
      const key = `${this.RATE_LIMIT_PREFIX}${identifier}`
      
      const current = await client.get(key)
      const now = Date.now()
      
      if (!current) {
        // First attempt
        await client.setex(key, windowSeconds, '1')
        return {
          allowed: true,
          remainingAttempts: maxAttempts - 1,
          resetTime: now + (windowSeconds * 1000)
        }
      }
      
      const attempts = parseInt(current)
      if (attempts >= maxAttempts) {
        const ttl = await client.ttl(key)
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime: now + (ttl * 1000)
        }
      }
      
      // Increment attempts
      await client.incr(key)
      const ttl = await client.ttl(key)
      
      return {
        allowed: true,
        remainingAttempts: maxAttempts - attempts - 1,
        resetTime: now + (ttl * 1000)
      }
    } catch (error) {
      console.error('Redis rate limit error:', error)
      // Fail open - allow access if Redis is down
      return {
        allowed: true,
        remainingAttempts: maxAttempts,
        resetTime: Date.now() + (windowSeconds * 1000)
      }
    }
  }

  /**
   * Clean up expired tokens and sessions
   */
  static async cleanup(): Promise<void> {
    try {
      const client = getRedisClient()
      
      // Redis automatically handles TTL expiry, but we can do manual cleanup if needed
      const expiredTokenKeys = await client.keys(`${this.TOKEN_BLACKLIST_PREFIX}*`)
      const expiredSessionKeys = await client.keys(`${this.USER_SESSION_PREFIX}*`)
      
      // Check each key's TTL and remove if expired
      const keysToDelete = []
      
      for (const key of [...expiredTokenKeys, ...expiredSessionKeys]) {
        const ttl = await client.ttl(key)
        if (ttl === -1 || ttl === -2) {
          keysToDelete.push(key)
        }
      }
      
      if (keysToDelete.length > 0) {
        await client.del(...keysToDelete)
      }
      
      console.log(`Cleaned up ${keysToDelete.length} expired keys`)
    } catch (error) {
      console.error('Redis cleanup error:', error)
    }
  }
}