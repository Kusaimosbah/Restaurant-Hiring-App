import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const updateProfileSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  // Restaurant owner fields
  restaurantName: z.string().optional(),
  restaurantAddress: z.string().optional(),
  restaurantDescription: z.string().optional(),
  restaurantPhone: z.string().optional(),
  restaurantEmail: z.string().optional(),
  restaurantLogoUrl: z.string().optional(),
  // Worker fields
  bio: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  hourlyRate: z.number().positive().optional(),
  availability: z.string().optional(),
  resumeUrl: z.string().optional(),
  profilePictureUrl: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        restaurant: true,
        workerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      restaurant: user.restaurant,
      workerProfile: user.workerProfile
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = updateProfileSchema.parse(body)

    const isAdmin = session.user.role === 'RESTAURANT_OWNER'

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id
      },
      data: {
        name: data.name,
        email: data.email
      }
    })

    if (isAdmin) {
      // Update restaurant info
      await prisma.restaurant.upsert({
        where: {
          ownerId: session.user.id
        },
        update: {
          name: data.restaurantName || '',
          address: data.restaurantAddress || '',
          description: data.restaurantDescription,
          phone: data.restaurantPhone,
          email: data.restaurantEmail,
          logoUrl: data.restaurantLogoUrl
        },
        create: {
          name: data.restaurantName || '',
          address: data.restaurantAddress || '',
          description: data.restaurantDescription,
          phone: data.restaurantPhone,
          email: data.restaurantEmail,
          logoUrl: data.restaurantLogoUrl,
          ownerId: session.user.id
        }
      })
    } else {
      // Update worker profile
      await prisma.workerProfile.upsert({
        where: {
          userId: session.user.id
        },
        update: {
          bio: data.bio,
          experience: data.experience,
          skills: data.skills || [],
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          resumeUrl: data.resumeUrl,
          profilePictureUrl: data.profilePictureUrl
        },
        create: {
          bio: data.bio,
          experience: data.experience,
          skills: data.skills || [],
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          resumeUrl: data.resumeUrl,
          profilePictureUrl: data.profilePictureUrl,
          userId: session.user.id
        }
      })
    }

    // Fetch updated profile
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        restaurant: true,
        workerProfile: true
      }
    })

    return NextResponse.json({
      id: user!.id,
      name: user!.name,
      email: user!.email,
      role: user!.role,
      restaurant: user!.restaurant,
      workerProfile: user!.workerProfile
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}