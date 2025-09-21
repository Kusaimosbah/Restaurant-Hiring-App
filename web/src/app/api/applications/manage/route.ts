import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const updateApplicationSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  responseNote: z.string().optional()
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

    const isAdmin = session.user.role === 'RESTAURANT_OWNER'

    if (isAdmin) {
      // Get applications for restaurant owner
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

      const applications = await prisma.application.findMany({
        where: { restaurantId: restaurant.id },
        include: {
          worker: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          job: {
            select: {
              id: true,
              title: true,
              hourlyRate: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      })

      return NextResponse.json(applications)
    } else {
      // Get applications for worker
      const workerProfile = await prisma.workerProfile.findUnique({
        where: {
          userId: session.user.id
        }
      })

      if (!workerProfile) {
        return NextResponse.json(
          { error: 'Worker profile not found' },
          { status: 404 }
        )
      }

      const applications = await prisma.application.findMany({
        where: { workerId: workerProfile.id },
        include: {
          job: {
            include: {
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  address: true
                }
              }
            }
          }
        },
        orderBy: { appliedAt: 'desc' }
      })

      return NextResponse.json(applications)
    }
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const applicationId = url.searchParams.get('id')

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, responseNote } = updateApplicationSchema.parse(body)

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

    // Verify the application belongs to this restaurant
    const existingApplication = await prisma.application.findUnique({
      where: {
        id: applicationId
      }
    })

    if (!existingApplication || existingApplication.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const updatedApplication = await prisma.application.update({
      where: {
        id: applicationId
      },
      data: {
        status,
        responseNote,
        respondedAt: new Date()
      },
      include: {
        worker: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        job: {
          select: {
            id: true,
            title: true,
            hourlyRate: true
          }
        }
      }
    })

    return NextResponse.json(updatedApplication)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}