import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
}

/**
 * Middleware to verify JWT token and add user to request
 */
export async function withAuth(
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

      // Verify token
      const { userId } = AuthService.verifyAccessToken(token)

      // Get user details
      const user = await AuthService.getUserById(userId)
      
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
 * Role-based access control middleware
 */
export function withRole(roles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(async (request: AuthenticatedRequest) => {
      if (!request.user || !roles.includes(request.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(request)
    })
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>()

  return (handler: (req: NextRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      const now = Date.now()
      
      const clientData = requests.get(clientIp)
      
      if (!clientData || now > clientData.resetTime) {
        // First request or window expired
        requests.set(clientIp, { count: 1, resetTime: now + windowMs })
      } else {
        // Increment counter
        clientData.count++
        
        if (clientData.count > maxRequests) {
          return NextResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 }
          )
        }
      }

      return handler(request)
    }
  }
}