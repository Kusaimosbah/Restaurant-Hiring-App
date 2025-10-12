import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Get system status
    const userCount = await prisma.user.count()
    const tokenCount = await prisma.refreshToken.count()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      authentication: 'ready',
      stats: {
        users: userCount,
        activeTokens: tokenCount
      },
      version: '2.0.0',
      features: {
        signup: true,
        signin: true,
        emailVerification: true,
        passwordReset: true,
        tokenRefresh: true,
        accountLockout: true,
        rateLimiting: true
      }
    })
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      authentication: 'unavailable',
      error: 'Database connection failed'
    }, { status: 503 })
  }
}