import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const applyJobSchema = z.object({
  jobId: z.string(),
  message: z.string().optional(),
  coverLetterUrl: z.string().optional()
})

const applicationSearchSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN']).optional(),
  jobId: z.string().optional(),
  restaurantId: z.string().optional(),
  workerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  sortBy: z.enum(['appliedAt', 'respondedAt', 'status', 'jobTitle']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const searchData = {
      status: searchParams.get('status') as any || undefined,
      jobId: searchParams.get('jobId') || undefined,
      restaurantId: searchParams.get('restaurantId') || undefined, 
      workerId: searchParams.get('workerId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: (searchParams.get('sortBy') as any) || 'appliedAt',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    const filters = applicationSearchSchema.parse(searchData)

    // Build where clause based on user role and filters
    const whereClause: any = {}

    // Role-based filtering
    if (session.user.role === 'WORKER') {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id }
      })
      if (!workerProfile) {
        return NextResponse.json({ applications: [], pagination: { totalApplications: 0 } })
      }
      whereClause.workerId = workerProfile.id
    } else if (session.user.role === 'RESTAURANT_OWNER') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      })
      if (!restaurant) {
        return NextResponse.json({ applications: [], pagination: { totalApplications: 0 } })
      }
      whereClause.restaurantId = restaurant.id
    }

    // Apply additional filters
    if (filters.status) whereClause.status = filters.status
    if (filters.jobId) whereClause.jobId = filters.jobId
    if (filters.restaurantId && session.user.role !== 'RESTAURANT_OWNER') {
      whereClause.restaurantId = filters.restaurantId
    }
    if (filters.workerId && session.user.role !== 'WORKER') {
      whereClause.workerId = filters.workerId
    }

    // Date filtering
    if (filters.dateFrom || filters.dateTo) {
      whereClause.appliedAt = {}
      if (filters.dateFrom) whereClause.appliedAt.gte = new Date(filters.dateFrom)
      if (filters.dateTo) whereClause.appliedAt.lte = new Date(filters.dateTo)
    }

    // Build sort configuration
    const orderBy: any = {}
    if (filters.sortBy === 'jobTitle') {
      orderBy.job = { title: filters.sortOrder }
    } else {
      orderBy[filters.sortBy] = filters.sortOrder
    }

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            description: true,
            jobType: true,
            skillLevel: true,
            hourlyRate: true,
            startDate: true,
            endDate: true,
            status: true,
            urgency: true
          }
        },
        worker: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            reviewsReceived: {
              select: {
                rating: true
              },
              where: {
                isPublic: true
              }
            },
            _count: {
              select: {
                shiftAssignments: true,
                applications: true
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 3
        }
      },
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    })

    // Enrich applications with calculated data
    const enrichedApplications = applications.map((application: any) => {
      const reviews = application.worker.reviewsReceived
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : null

      return {
        ...application,
        worker: {
          ...application.worker,
          averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
          totalReviews: reviews.length
        }
      }
    })

    const totalApplications = await prisma.application.count({ where: whereClause })

    return NextResponse.json({
      applications: enrichedApplications,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(totalApplications / filters.limit),
        totalApplications,
        hasNext: filters.page * filters.limit < totalApplications,
        hasPrev: filters.page > 1,
        limit: filters.limit
      },
      filters
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, message, coverLetterUrl } = applyJobSchema.parse(body)

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

    const job = await prisma.job.findUnique({
      where: {
        id: jobId
      },
      include: {
        restaurant: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Job is not active' },
        { status: 400 }
      )
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: workerProfile.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Already applied to this job' },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        restaurantId: job.restaurantId,
        message,
        coverLetterUrl
      },
      include: {
        job: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
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
        }
      }
    })

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}