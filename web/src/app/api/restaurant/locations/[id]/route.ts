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
 * GET /api/restaurant/locations/[id]
 * 
 * Fetches a specific location by ID
 * Requires authentication as a restaurant owner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id

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

    // Get location
    const location = await prisma.location.findUnique({
      where: {
        id: locationId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Verify location belongs to the restaurant
    if (location.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This location does not belong to your restaurant.' },
        { status: 403 }
      )
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/restaurant/locations/[id]
 * 
 * Updates a specific location
 * Requires authentication as a restaurant owner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id

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

    // Get location
    const location = await prisma.location.findUnique({
      where: {
        id: locationId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Verify location belongs to the restaurant
    if (location.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This location does not belong to your restaurant.' },
        { status: 403 }
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
    if (validationResult.data.isMainLocation && !location.isMainLocation) {
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

    // Update location
    const updatedLocation = await prisma.location.update({
      where: {
        id: locationId
      },
      data: validationResult.data
    })
    
    return NextResponse.json(updatedLocation)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/restaurant/locations/[id]
 * 
 * Deletes a specific location
 * Requires authentication as a restaurant owner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const locationId = params.id

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
        locations: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get location
    const location = await prisma.location.findUnique({
      where: {
        id: locationId
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Verify location belongs to the restaurant
    if (location.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This location does not belong to your restaurant.' },
        { status: 403 }
      )
    }

    // Prevent deletion if it's the only location
    if (restaurant.locations.length === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only location. Restaurants must have at least one location.' },
        { status: 400 }
      )
    }

    // Prevent deletion of main location if there are other locations
    if (location.isMainLocation && restaurant.locations.length > 1) {
      return NextResponse.json(
        { error: 'Cannot delete the main location. Please set another location as main first.' },
        { status: 400 }
      )
    }

    // Delete location
    await prisma.location.delete({
      where: {
        id: locationId
      }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
