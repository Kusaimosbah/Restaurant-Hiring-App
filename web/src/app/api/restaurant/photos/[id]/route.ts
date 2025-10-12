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
 * GET /api/restaurant/photos/[id]
 * 
 * Fetches a specific photo by ID
 * Requires authentication as a restaurant owner
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id

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

    // Get photo
    const photo = await prisma.restaurantPhoto.findUnique({
      where: {
        id: photoId
      }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify photo belongs to the restaurant
    if (photo.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This photo does not belong to your restaurant.' },
        { status: 403 }
      )
    }

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error fetching photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/restaurant/photos/[id]
 * 
 * Updates a specific photo
 * Requires authentication as a restaurant owner
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id

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

    // Get photo
    const photo = await prisma.restaurantPhoto.findUnique({
      where: {
        id: photoId
      }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify photo belongs to the restaurant
    if (photo.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This photo does not belong to your restaurant.' },
        { status: 403 }
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

    // Update photo
    const updatedPhoto = await prisma.restaurantPhoto.update({
      where: {
        id: photoId
      },
      data: validationResult.data
    })
    
    return NextResponse.json(updatedPhoto)
  } catch (error) {
    console.error('Error updating photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/restaurant/photos/[id]
 * 
 * Deletes a specific photo
 * Requires authentication as a restaurant owner
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = params.id

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

    // Get photo
    const photo = await prisma.restaurantPhoto.findUnique({
      where: {
        id: photoId
      }
    })

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      )
    }

    // Verify photo belongs to the restaurant
    if (photo.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Access denied. This photo does not belong to your restaurant.' },
        { status: 403 }
      )
    }

    // Delete photo
    await prisma.restaurantPhoto.delete({
      where: {
        id: photoId
      }
    })
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting photo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
