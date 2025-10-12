import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owner access required' },
        { status: 401 }
      )
    }

    const candidateId = params.id

    // Get detailed candidate profile
    const candidate = await prisma.workerProfile.findUnique({
      where: { id: candidateId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            lastLoginAt: true
          }
        },
        reviewsReceived: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          },
          where: {
            isPublic: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        applications: {
          include: {
            job: {
              select: {
                id: true,
                title: true,
                jobType: true,
                skillLevel: true,
                startDate: true,
                endDate: true
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            appliedAt: 'desc'
          },
          take: 10 // Recent applications
        },
        shiftAssignments: {
          include: {
            job: {
              select: {
                id: true,
                title: true
              }
            },
            restaurant: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            endTime: 'desc'
          },
          take: 10 // Recent shifts
        },
        availabilitySlots: {
          orderBy: {
            dayOfWeek: 'asc'
          }
        },
        _count: {
          select: {
            applications: true,
            reviewsReceived: true,
            shiftAssignments: true
          }
        }
      }
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Check if this is a worker (not restaurant owner)
    if (candidate.user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Profile not available' },
        { status: 404 }
      )
    }

    // Calculate statistics
    const reviews = candidate.reviewsReceived
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
      : null

    const ratingDistribution = reviews.reduce((dist: any, review: any) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1
      return dist
    }, {})

    // Calculate completion rate (completed vs total applications)
    const completedApplications = candidate.applications.filter((app: any) => 
      app.status === 'ACCEPTED' && candidate.shiftAssignments.some((shift: any) => 
        shift.applicationId === app.id
      )
    ).length

    const completionRate = candidate.applications.length > 0 
      ? (completedApplications / candidate.applications.length) * 100
      : 0

    // Get recent activity timeline
    const recentActivity = [
      ...candidate.applications.slice(0, 5).map((app: any) => ({
        type: 'application',
        date: app.appliedAt,
        description: `Applied for ${app.job.title} at ${app.restaurant.name}`,
        status: app.status
      })),
      ...candidate.shiftAssignments.slice(0, 5).map((shift: any) => ({
        type: 'shift',
        date: shift.endTime,
        description: `Completed shift: ${shift.job.title} at ${shift.restaurant.name}`,
        status: shift.status
      })),
      ...reviews.slice(0, 5).map((review: any) => ({
        type: 'review',
        date: review.createdAt,
        description: `Received ${review.rating}-star review from ${review.restaurant.name}`,
        status: 'public'
      }))
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    // Profile completeness score
    let completenessScore = 0
    const fields = [
      { field: 'bio', weight: 20 },
      { field: 'experience', weight: 15 },
      { field: 'skills', weight: 15 },
      { field: 'hourlyRate', weight: 10 },
      { field: 'availability', weight: 10 },
      { field: 'profilePictureUrl', weight: 10 },
      { field: 'resumeUrl', weight: 10 },
      { field: 'phone', weight: 5, source: 'user' },
      { field: 'availabilitySlots', weight: 5 }
    ]

    fields.forEach(({ field, weight, source }) => {
      const value = source === 'user' ? candidate.user[field as keyof typeof candidate.user] : candidate[field as keyof typeof candidate]
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        completenessScore += weight
      }
    })

    const enrichedCandidate = {
      id: candidate.id,
      user: candidate.user,
      bio: candidate.bio,
      experience: candidate.experience,
      skills: candidate.skills,
      hourlyRate: candidate.hourlyRate,
      availability: candidate.availability,
      profilePictureUrl: candidate.profilePictureUrl,
      resumeUrl: candidate.resumeUrl,
      availabilitySlots: candidate.availabilitySlots,
      
      // Statistics
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      totalReviews: candidate._count.reviewsReceived,
      ratingDistribution,
      totalApplications: candidate._count.applications,
      totalShiftsCompleted: candidate._count.shiftAssignments,
      completionRate: Math.round(completionRate * 10) / 10,
      completenessScore,
      
      // Detailed data
      reviews: reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        restaurant: review.restaurant,
        createdAt: review.createdAt,
        isPublic: review.isPublic
      })),
      
      recentApplications: candidate.applications.slice(0, 5).map((app: any) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        respondedAt: app.respondedAt,
        job: app.job,
        restaurant: app.restaurant
      })),
      
      recentShifts: candidate.shiftAssignments.slice(0, 5).map((shift: any) => ({
        id: shift.id,
        startTime: shift.startTime,
        endTime: shift.endTime,
        status: shift.status,
        job: shift.job,
        restaurant: shift.restaurant
      })),
      
      recentActivity,
      
      // Metadata
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
      profileViewedAt: new Date().toISOString()
    }

    return NextResponse.json({
      candidate: enrichedCandidate,
      insights: {
        reliability: averageRating && averageRating >= 4.0 ? 'High' : 
                   averageRating && averageRating >= 3.0 ? 'Medium' : 
                   averageRating ? 'Low' : 'Unknown',
        experience: candidate._count.shiftAssignments > 20 ? 'Experienced' :
                   candidate._count.shiftAssignments > 5 ? 'Moderate' : 'Beginner',
        responsiveness: completionRate > 80 ? 'Highly responsive' :
                       completionRate > 50 ? 'Moderately responsive' : 'Needs improvement',
        profileQuality: completenessScore > 80 ? 'Excellent' :
                       completenessScore > 60 ? 'Good' : 'Needs improvement'
      }
    })

  } catch (error) {
    console.error('Error fetching candidate profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}