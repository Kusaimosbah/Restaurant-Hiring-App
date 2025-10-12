import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    // Refresh tokens
    const tokens = await AuthService.refreshToken(refreshToken)

    // Set new refresh token as httpOnly cookie
    const response = NextResponse.json({
      success: true,
      accessToken: tokens.accessToken,
      message: 'Token refreshed successfully'
    })

    // Set new refresh token cookie
    response.cookies.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Token refresh error:', error)
    
    // Clear invalid refresh token
    const response = NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    )
    
    response.cookies.delete('refreshToken')
    
    return response
  }
}