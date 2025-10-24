import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for validating restaurant profile update
const restaurantProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  businessType: z.string().max(50).optional().nullable(),
  cuisineType: z.string().max(50).optional().nullable(),
  websiteUrl: z.string().url('Invalid URL').optional().nullable(),
  logoUrl: z.string().url('Invalid URL').optional().nullable(),
})

/**
 * GET /api/restaurant/profile
 * 
 * Fetches the restaurant profile with all related data
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

    // Fetch restaurant with all relations
    const restaurant = await prisma.restaurant.findUnique({
      where: {
        ownerId: session.user.id
      },
      include: {
        address: true,
        locations: true,
        photos: {
          orderBy: {
            sortOrder: 'asc'
          }
        },
        paymentInfo: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)
  } catch (error) {
    console.error('Error fetching restaurant profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/restaurant/profile
 * 
 * Updates the restaurant profile basic information
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
    
    const validationResult = restaurantProfileSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    // Update restaurant profile
    const updatedRestaurant = await prisma.restaurant.update({
      where: {
        id: restaurant.id
      },
      data: {
        name: validationResult.data.name,
        description: validationResult.data.description,
        phone: validationResult.data.phone,
        email: validationResult.data.email,
        businessType: validationResult.data.businessType,
        cuisineType: validationResult.data.cuisineType,
        websiteUrl: validationResult.data.websiteUrl,
        logoUrl: validationResult.data.logoUrl,
      }
    })

    return NextResponse.json(updatedRestaurant)
  } catch (error) {
    console.error('Error updating restaurant profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
