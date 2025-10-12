import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for validating location data
const locationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  street: z.string().min(2, 'Street must be at least 2 characters').max(100),
  city: z.string().min(2, 'City must be at least 2 characters').max(100),
  state: z.string().min(2, 'State must be at least 2 characters').max(100),
  zipCode: z.string().min(2, 'Zip code must be at least 2 characters').max(20),
  country: z.string().default('United States').max(100),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  isMainLocation: z.boolean().default(false),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
})

/**
 * GET /api/restaurant/locations
 * 
 * Fetches all locations for the restaurant
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
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get all locations for the restaurant
    const locations = await prisma.location.findMany({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: {
        isMainLocation: 'desc'
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching restaurant locations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/restaurant/locations
 * 
 * Creates a new location for the restaurant
 * Requires authentication as a restaurant owner
 */
export async function POST(request: NextRequest) {
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
    
    const validationResult = locationSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    // If this is marked as the main location, update all other locations
    if (validationResult.data.isMainLocation) {
      await prisma.location.updateMany({
        where: {
          restaurantId: restaurant.id,
          isMainLocation: true
        },
        data: {
          isMainLocation: false
        }
      })
    }

    // Create new location
    const newLocation = await prisma.location.create({
      data: {
        ...validationResult.data,
        restaurantId: restaurant.id
      }
    })
    
    return NextResponse.json(newLocation, { status: 201 })
  } catch (error) {
    console.error('Error creating restaurant location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
