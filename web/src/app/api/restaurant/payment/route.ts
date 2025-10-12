import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for validating payment info data
const paymentInfoSchema = z.object({
  stripeCustomerId: z.string().max(100).optional().nullable(),
  stripeAccountId: z.string().max(100).optional().nullable(),
  bankAccountLast4: z.string().max(4).optional().nullable(),
  cardLast4: z.string().max(4).optional().nullable(),
  isVerified: z.boolean().default(false),
})

/**
 * GET /api/restaurant/payment
 * 
 * Fetches the restaurant payment information
 * Requires authentication as a restaurant owner
 */
export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a restaurant owner
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Only restaurant owners can access this resource.' },
        { status: 403 }
      )
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      include: {
        paymentInfo: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant.paymentInfo || { exists: false })
  } catch (error) {
    console.error('Error fetching restaurant payment info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/restaurant/payment
 * 
 * Updates or creates the restaurant payment information
 * Requires authentication as a restaurant owner
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is a restaurant owner
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Access denied. Only restaurant owners can access this resource.' },
        { status: 403 }
      )
    }

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      include: {
        paymentInfo: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    const validationResult = paymentInfoSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    // Update or create payment info
    if (restaurant.paymentInfo) {
      // Update existing payment info
      const updatedPaymentInfo = await prisma.paymentInfo.update({
        where: {
          id: restaurant.paymentInfo.id
        },
        data: validationResult.data
      })
      
      return NextResponse.json(updatedPaymentInfo)
    } else {
      // Create new payment info
      const newPaymentInfo = await prisma.paymentInfo.create({
        data: {
          ...validationResult.data,
          restaurantId: restaurant.id
        }
      })
      
      return NextResponse.json(newPaymentInfo)
    }
  } catch (error) {
    console.error('Error updating restaurant payment info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
