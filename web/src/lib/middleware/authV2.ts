import { NextRequest, NextResponse } from 'next/server'
import { AuthServiceV2 } from '@/lib/services/authServiceV2'
import { TokenManager } from '@/lib/services/tokenManager'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

/**
 * Enhanced authentication middleware with token blacklisting
 */
export function withAuthV2(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (!token) {
        return NextResponse.json(
          { error: 'Authorization token required' },
          { status: 401 }
        )
      }

      // Verify token with blacklist check
      const { userId } = await AuthServiceV2.verifyAccessToken(token)

      // Get user details
      const user = await AuthServiceV2.getUserById(userId)
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        )
      }

      // Add user to request
      const authenticatedRequest = request as AuthenticatedRequest
      authenticatedRequest.user = user

      return handler(authenticatedRequest)

    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
  }
}

/**
 * Enhanced rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number = 100, 
  windowSeconds: number = 900,
  identifier?: (req: NextRequest) => string
) {
  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const clientId = identifier 
        ? identifier(request)
        : request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      
      const rateLimitResult = await TokenManager.checkRateLimit(
        `api:${clientId}`, 
        maxRequests, 
        windowSeconds
      )
      
      if (!rateLimitResult.allowed) {
        const resetTimeSeconds = Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        
        const response = NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: resetTimeSeconds,
            resetTime: rateLimitResult.resetTime
          },
          { status: 429 }
        )
        
        response.headers.set('Retry-After', resetTimeSeconds.toString())
        response.headers.set('X-RateLimit-Limit', maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingAttempts.toString())
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        
        return response
      }

      const response = await handler(request)
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingAttempts.toString())
      response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
      
      return response
    }
  }
}

/**
 * Role-based access control with enhanced security
 */
export function withRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuthV2(async (request: AuthenticatedRequest) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return NextResponse.json(
          { 
            error: 'Insufficient permissions',
            required: roles,
            current: request.user?.role || 'none'
          },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

/**
 * Security headers middleware
 */
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const response = await handler(request)
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // Only add HSTS in production with HTTPS
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    
    return response
  }
}

/**
 * Request logging middleware
 */
export function withLogging(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    
    // Log request
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown IP'
    console.log(`📥 ${request.method} ${request.url} - ${clientIp}`)
    
    try {
      const response = await handler(request)
      const duration = Date.now() - startTime
      
      // Log response
      console.log(`📤 ${request.method} ${request.url} - ${response.status} (${duration}ms)`)
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`💥 ${request.method} ${request.url} - ERROR (${duration}ms):`, error)
      throw error
    }
  }
}

/**
 * Compose multiple middleware functions
 */
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler)
  }
}