import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  requirements: z.string().optional(),
  hourlyRate: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  maxWorkers: z.number().positive().default(1)
})

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createJobSchema.parse(body)

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

    const job = await prisma.job.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        restaurantId: restaurant.id
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true
          }
        }
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}