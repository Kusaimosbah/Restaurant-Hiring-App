import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Search filters schema
const candidateSearchSchema = z.object({
  // Basic search
  query: z.string().optional(), // General search in name, bio, experience
  skills: z.array(z.string()).optional(), // Required skills
  experience: z.string().optional(), // Experience level filter
  
  // Rate and availability
  minHourlyRate: z.number().optional(),
  maxHourlyRate: z.number().optional(),
  availability: z.string().optional(),
  
  // Location and distance (future enhancement)
  location: z.string().optional(),
  radius: z.number().optional(), // miles
  
  // Ratings and verification
  minRating: z.number().min(1).max(5).optional(),
  hasResume: z.boolean().optional(),
  hasProfilePicture: z.boolean().optional(),
  
  // Pagination
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10),
  
  // Sorting
  sortBy: z.enum(['relevance', 'rating', 'experience', 'hourlyRate', 'recent']).default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owner access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse and validate search parameters
    const searchData = {
      query: searchParams.get('query') || undefined,
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || undefined,
      experience: searchParams.get('experience') || undefined,
      minHourlyRate: searchParams.get('minHourlyRate') ? parseFloat(searchParams.get('minHourlyRate')!) : undefined,
      maxHourlyRate: searchParams.get('maxHourlyRate') ? parseFloat(searchParams.get('maxHourlyRate')!) : undefined,
      availability: searchParams.get('availability') || undefined,
      location: searchParams.get('location') || undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      hasResume: searchParams.get('hasResume') ? searchParams.get('hasResume') === 'true' : undefined,
      hasProfilePicture: searchParams.get('hasProfilePicture') ? searchParams.get('hasProfilePicture') === 'true' : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc'
    }

    const filters = candidateSearchSchema.parse(searchData)

    // Build where clause for filtering
    const whereClause: any = {
      user: {
        role: 'WORKER'
      }
    }

    // Text search in name, bio, and experience
    if (filters.query) {
      whereClause.OR = [
        { user: { name: { contains: filters.query, mode: 'insensitive' } } },
        { bio: { contains: filters.query, mode: 'insensitive' } },
        { experience: { contains: filters.query, mode: 'insensitive' } }
      ]
    }

    // Skills filtering - worker must have ALL specified skills
    if (filters.skills && filters.skills.length > 0) {
      whereClause.skills = {
        hasEvery: filters.skills
      }
    }

    // Experience filter (contains match)
    if (filters.experience) {
      whereClause.experience = {
        contains: filters.experience,
        mode: 'insensitive'
      }
    }

    // Hourly rate filtering
    if (filters.minHourlyRate !== undefined || filters.maxHourlyRate !== undefined) {
      whereClause.hourlyRate = {}
      if (filters.minHourlyRate !== undefined) {
        whereClause.hourlyRate.gte = filters.minHourlyRate
      }
      if (filters.maxHourlyRate !== undefined) {
        whereClause.hourlyRate.lte = filters.maxHourlyRate
      }
    }

    // Availability filter
    if (filters.availability) {
      whereClause.availability = {
        contains: filters.availability,
        mode: 'insensitive'
      }
    }

    // Resume filter
    if (filters.hasResume !== undefined) {
      whereClause.resumeUrl = filters.hasResume ? { not: null } : null
    }

    // Profile picture filter  
    if (filters.hasProfilePicture !== undefined) {
      whereClause.profilePictureUrl = filters.hasProfilePicture ? { not: null } : null
    }

    // Get candidates with aggregated rating
    const candidates = await prisma.workerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        reviewsReceived: {
          select: {
            rating: true,
            comment: true,
            createdAt: true,
            restaurant: {
              select: {
                name: true
              }
            }
          },
          where: {
            isPublic: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5 // Recent reviews
        },
        applications: {
          select: {
            id: true,
            status: true,
            appliedAt: true,
            job: {
              select: {
                title: true,
                restaurant: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          },
          take: 3 // Recent applications
        },
        _count: {
          select: {
            applications: true,
            reviewsReceived: true,
            shiftAssignments: true
          }
        }
      },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit
    })

    // Calculate average ratings and format response
    const candidatesWithRatings = candidates.map((candidate: any) => {
      const reviews = candidate.reviewsReceived
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : null

      return {
        id: candidate.id,
        user: candidate.user,
        bio: candidate.bio,
        experience: candidate.experience,
        skills: candidate.skills,
        hourlyRate: candidate.hourlyRate,
        availability: candidate.availability,
        profilePictureUrl: candidate.profilePictureUrl,
        resumeUrl: candidate.resumeUrl,
        averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
        totalReviews: candidate._count.reviewsReceived,
        totalApplications: candidate._count.applications,
        totalShiftsCompleted: candidate._count.shiftAssignments,
        recentReviews: reviews.slice(0, 3),
        recentApplications: candidate.applications,
        createdAt: candidate.createdAt
      }
    })

    // Apply rating filter after calculation
    let filteredCandidates = candidatesWithRatings
    if (filters.minRating !== undefined) {
      filteredCandidates = candidatesWithRatings.filter(
        (candidate: any) => candidate.averageRating !== null && candidate.averageRating >= filters.minRating!
      )
    }

    // Apply sorting
    filteredCandidates.sort((a: any, b: any) => {
      const order = filters.sortOrder === 'asc' ? 1 : -1
      
      switch (filters.sortBy) {
        case 'rating':
          const aRating = a.averageRating || 0
          const bRating = b.averageRating || 0
          return (aRating - bRating) * order
          
        case 'experience':
          const aExp = a.totalShiftsCompleted
          const bExp = b.totalShiftsCompleted
          return (aExp - bExp) * order
          
        case 'hourlyRate':
          const aRate = a.hourlyRate || 0
          const bRate = b.hourlyRate || 0
          return (aRate - bRate) * order
          
        case 'recent':
          const aDate = new Date(a.createdAt).getTime()
          const bDate = new Date(b.createdAt).getTime()
          return (aDate - bDate) * order
          
        case 'relevance':
        default:
          // Relevance scoring: rating + experience + completeness
          const aScore = (a.averageRating || 0) * 2 + 
                        a.totalShiftsCompleted * 0.1 + 
                        (a.bio ? 1 : 0) + 
                        (a.resumeUrl ? 1 : 0) +
                        (a.profilePictureUrl ? 1 : 0)
          const bScore = (b.averageRating || 0) * 2 + 
                        b.totalShiftsCompleted * 0.1 + 
                        (b.bio ? 1 : 0) + 
                        (b.resumeUrl ? 1 : 0) +
                        (b.profilePictureUrl ? 1 : 0)
          return (aScore - bScore) * order
      }
    })

    // Get total count for pagination
    const totalCandidates = await prisma.workerProfile.count({
      where: whereClause
    })

    return NextResponse.json({
      candidates: filteredCandidates,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(totalCandidates / filters.limit),
        totalCandidates,
        hasNext: filters.page * filters.limit < totalCandidates,
        hasPrev: filters.page > 1,
        limit: filters.limit
      },
      filters: filters,
      meta: {
        searchTime: Date.now(),
        algorithm: 'multi-factor-relevance'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error searching candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}