import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for validating address data
const addressSchema = z.object({
  street: z.string().min(2, 'Street must be at least 2 characters').max(100),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().min(2, 'State must be at least 2 characters').max(100),
  zipCode: z.string().min(2, 'Zip code must be at least 2 characters').max(20),
  country: z.string().max(100).default('United States'),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
})

/**
 * GET /api/restaurant/address
 * 
 * Fetches the restaurant address
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
        address: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant.address)
  } catch (error) {
    console.error('Error fetching restaurant address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/restaurant/address
 * 
 * Updates or creates the restaurant address
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
        address: true
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
    
    const validationResult = addressSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    // Update or create address
    if (restaurant.address) {
      // Update existing address
      const updatedAddress = await prisma.address.update({
        where: {
          id: restaurant.address.id
        },
        data: validationResult.data
      })
      
      return NextResponse.json(updatedAddress)
    } else {
      // Create new address
      const newAddress = await prisma.address.create({
        data: {
          ...validationResult.data,
          restaurantId: restaurant.id
        }
      })
      
      return NextResponse.json(newAddress)
    }
  } catch (error) {
    console.error('Error updating restaurant address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}