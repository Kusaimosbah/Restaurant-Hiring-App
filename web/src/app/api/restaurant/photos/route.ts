import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Schema for validating photo data
const photoSchema = z.object({
  url: z.string().url('Invalid URL'),
  caption: z.string().max(200).optional().nullable(),
  sortOrder: z.number().int().default(0),
  type: z.enum(['INTERIOR', 'EXTERIOR', 'FOOD', 'STAFF', 'MENU', 'OTHER']).default('OTHER'),
})

/**
 * GET /api/restaurant/photos
 * 
 * Fetches all photos for the restaurant
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

    // Get all photos for the restaurant
    const photos = await prisma.restaurantPhoto.findMany({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: {
        sortOrder: 'asc'
      }
    })

    return NextResponse.json(photos)
  } catch (error) {
    console.error('Error fetching restaurant photos:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/restaurant/photos
 * 
 * Adds a new photo to the restaurant
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
    
    const validationResult = photoSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      )
    }

    // Get the highest sort order to place new photo at the end
    const highestSortOrder = await prisma.restaurantPhoto.findFirst({
      where: {
        restaurantId: restaurant.id
      },
      orderBy: {
        sortOrder: 'desc'
      },
      select: {
        sortOrder: true
      }
    })

    const nextSortOrder = highestSortOrder ? highestSortOrder.sortOrder + 1 : 0

    // Create new photo
    const newPhoto = await prisma.restaurantPhoto.create({
      data: {
        ...validationResult.data,
        sortOrder: validationResult.data.sortOrder || nextSortOrder,
        restaurantId: restaurant.id
      }
    })
    
    return NextResponse.json(newPhoto, { status: 201 })
  } catch (error) {
    console.error('Error adding restaurant photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
