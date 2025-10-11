import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/authService'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role, phone, businessName } = await request.json()

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['WORKER', 'RESTAURANT_OWNER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // For restaurant owners, business name is required
    if (role === 'RESTAURANT_OWNER' && !businessName) {
      return NextResponse.json(
        { error: 'Business name is required for restaurant owners' },
        { status: 400 }
      )
    }

    // Create user
    const result = await AuthService.signup({
      email,
      password,
      name,
      role,
      phone,
      businessName
    })

    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
      message: 'Account created successfully. Please check your email to verify your account.'
    })

  } catch (error) {
    console.error('Signup error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}