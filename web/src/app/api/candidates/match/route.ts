import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { matchCandidatesForJob, JobRequirements, CandidateProfile } from '@/lib/matching/algorithm'

// Job matching request schema
const matchingRequestSchema = z.object({
  jobId: z.string(),
  limit: z.number().min(1).max(50).default(10),
  minScore: z.number().min(0).max(1).default(0.3) // Minimum match score to include
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owner access required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, limit, minScore } = matchingRequestSchema.parse(body)

    // Get the job with full details
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (job.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied - You can only match candidates for your own jobs' },
        { status: 403 }
      )
    }

    // Prepare job requirements for matching algorithm
    const jobRequirements: JobRequirements = {
      skillRequirements: Array.isArray(job.skillRequirements) ? job.skillRequirements : [],
      skillLevel: job.skillLevel,
      experienceMonths: job.experienceMonths || undefined,
      hourlyRate: job.hourlyRate,
      workDays: job.workDays,
      shiftStartTime: job.shiftStartTime || undefined,
      shiftEndTime: job.shiftEndTime || undefined,
      locationAddress: job.locationAddress || undefined,
      urgency: job.urgency
    }

    // Get all available candidates (workers who haven't already applied to this job)
    const candidates = await prisma.workerProfile.findMany({
      where: {
        user: {
          role: 'WORKER'
        },
        applications: {
          none: {
            jobId: jobId
          }
        }
      },
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
            applications: true,
            reviewsReceived: true
          }
        }
      }
    })

    // Transform candidates for matching algorithm
    const candidateProfiles: CandidateProfile[] = candidates.map((candidate: any) => {
      const reviews = candidate.reviewsReceived
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        : undefined

      return {
        id: candidate.id,
        skills: candidate.skills || [],
        experience: candidate.experience || '',
        hourlyRate: candidate.hourlyRate,
        availability: candidate.availability || '',
        averageRating,
        totalShiftsCompleted: candidate._count.shiftAssignments,
        bio: candidate.bio,
        locationAddress: undefined // Add location logic later
      }
    })

    // Run matching algorithm
    const matches = matchCandidatesForJob(jobRequirements, candidateProfiles)
      .filter(match => match.overallScore >= minScore)
      .slice(0, limit)

    // Enrich matches with full candidate data
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const candidate = candidates.find((c: any) => c.id === match.candidateId)
        if (!candidate) return null

        const reviews = candidate.reviewsReceived
        const averageRating = reviews.length > 0 
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
          : null

        return {
          ...match,
          candidate: {
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
            createdAt: candidate.createdAt
          }
        }
      })
    )

    const validMatches = enrichedMatches.filter(match => match !== null)

    // Generate summary statistics
    const summary = {
      totalCandidatesEvaluated: candidates.length,
      totalMatches: validMatches.length,
      averageMatchScore: validMatches.length > 0 
        ? validMatches.reduce((sum, match) => sum + match.overallScore, 0) / validMatches.length
        : 0,
      topMatchScore: validMatches.length > 0 ? validMatches[0].overallScore : 0,
      recommendedAction: validMatches.length === 0 
        ? 'Consider relaxing job requirements or posting to more job boards'
        : validMatches.length === 1 
          ? 'Contact the matched candidate immediately'
          : 'Review top candidates and conduct interviews'
    }

    return NextResponse.json({
      job: {
        id: job.id,
        title: job.title,
        skillLevel: job.skillLevel,
        skillRequirements: job.skillRequirements,
        hourlyRate: job.hourlyRate,
        urgency: job.urgency
      },
      matches: validMatches,
      summary,
      matchingCriteria: {
        minScore,
        evaluationFactors: [
          'Skills compatibility (25%)',
          'Experience level (20%)',
          'Availability match (20%)',
          'Rate alignment (15%)',
          'Location proximity (10%)',
          'Reliability score (10%)'
        ]
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error matching candidates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}