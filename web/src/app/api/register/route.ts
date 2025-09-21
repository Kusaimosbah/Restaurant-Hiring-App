import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['RESTAURANT_OWNER', 'WORKER'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, role } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    })

    // Create associated profile based on role
    if (role === 'RESTAURANT_OWNER') {
      await prisma.restaurant.create({
        data: {
          name: `${name}'s Restaurant`,
          address: '',
          ownerId: user.id
        }
      })
    } else if (role === 'WORKER') {
      await prisma.workerProfile.create({
        data: {
          userId: user.id
        }
      })
    }

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}