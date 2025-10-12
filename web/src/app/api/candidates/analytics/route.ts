import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owner access required' },
        { status: 401 }
      )
    }

    // Get candidate market overview
    const totalCandidates = await prisma.workerProfile.count({
      where: {
        user: {
          role: 'WORKER'
        }
      }
    })

    const candidatesWithResumes = await prisma.workerProfile.count({
      where: {
        user: {
          role: 'WORKER'
        },
        resumeUrl: {
          not: null
        }
      }
    })

    const candidatesWithPictures = await prisma.workerProfile.count({
      where: {
        user: {
          role: 'WORKER'
        },
        profilePictureUrl: {
          not: null
        }
      }
    })

    // Skill distribution
    const candidatesWithSkills = await prisma.workerProfile.findMany({
      where: {
        user: {
          role: 'WORKER'
        },
        skills: {
          not: {
            equals: []
          }
        }
      },
      select: {
        skills: true
      }
    })

    // Count skill frequency
    const skillFrequency: { [key: string]: number } = {}
    candidatesWithSkills.forEach((candidate: any) => {
      candidate.skills.forEach((skill: string) => {
        skillFrequency[skill] = (skillFrequency[skill] || 0) + 1
      })
    })

    const topSkills = Object.entries(skillFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([skill, count]) => ({ skill, count }))

    // Experience level distribution
    const experienceLevels = await prisma.workerProfile.groupBy({
      by: ['experience'],
      where: {
        user: {
          role: 'WORKER'
        },
        experience: {
          not: null
        }
      },
      _count: {
        experience: true
      }
    })

    // Hourly rate distribution
    const rateRanges = [
      { min: 0, max: 15, label: '$10-15/hr' },
      { min: 15, max: 20, label: '$15-20/hr' },
      { min: 20, max: 25, label: '$20-25/hr' },
      { min: 25, max: 30, label: '$25-30/hr' },
      { min: 30, max: 999, label: '$30+/hr' }
    ]

    const rateDistribution = await Promise.all(
      rateRanges.map(async (range) => {
        const count = await prisma.workerProfile.count({
          where: {
            user: {
              role: 'WORKER'
            },
            hourlyRate: {
              gte: range.min,
              lt: range.max === 999 ? undefined : range.max
            }
          }
        })
        return { ...range, count }
      })
    )

    // Average ratings distribution
    const candidatesWithReviews = await prisma.workerProfile.findMany({
      where: {
        user: {
          role: 'WORKER'
        }
      },
      include: {
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
            reviewsReceived: true,
            shiftAssignments: true,
            applications: true
          }
        }
      }
    })

    const ratingDistribution: { [key: string]: number } = {
      'No Reviews': 0,
      '1-2 Stars': 0,
      '3 Stars': 0,
      '4 Stars': 0,
      '5 Stars': 0
    }

    const experienceDistribution: { [key: string]: number } = {
      'No Experience': 0,
      'Beginner (1-5 shifts)': 0,
      'Intermediate (6-20 shifts)': 0,
      'Experienced (21-50 shifts)': 0,
      'Veteran (50+ shifts)': 0
    }

    candidatesWithReviews.forEach((candidate: any) => {
      const reviews = candidate.reviewsReceived
      const shiftsCount = candidate._count.shiftAssignments
      
      // Rating distribution
      if (reviews.length === 0) {
        ratingDistribution['No Reviews']++
      } else {
        const avgRating = reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
        if (avgRating < 3) ratingDistribution['1-2 Stars']++
        else if (avgRating < 4) ratingDistribution['3 Stars']++
        else if (avgRating < 4.5) ratingDistribution['4 Stars']++
        else ratingDistribution['5 Stars']++
      }

      // Experience distribution
      if (shiftsCount === 0) experienceDistribution['No Experience']++
      else if (shiftsCount <= 5) experienceDistribution['Beginner (1-5 shifts)']++
      else if (shiftsCount <= 20) experienceDistribution['Intermediate (6-20 shifts)']++
      else if (shiftsCount <= 50) experienceDistribution['Experienced (21-50 shifts)']++
      else experienceDistribution['Veteran (50+ shifts)']++
    })

    // Recent activity trends
    const last30Days = new Date()
    last30Days.setDate(last30Days.getDate() - 30)

    const recentActivity = {
      newCandidates: await prisma.workerProfile.count({
        where: {
          createdAt: {
            gte: last30Days
          },
          user: {
            role: 'WORKER'
          }
        }
      }),
      
      activeApplications: await prisma.application.count({
        where: {
          appliedAt: {
            gte: last30Days
          }
        }
      }),

      completedShifts: await prisma.shiftAssignment.count({
        where: {
          endTime: {
            gte: last30Days
          },
          status: 'COMPLETED'
        }
      })
    }

    // Market insights
    const averageHourlyRate = await prisma.workerProfile.aggregate({
      where: {
        user: {
          role: 'WORKER'
        },
        hourlyRate: {
          not: null
        }
      },
      _avg: {
        hourlyRate: true
      }
    })

    const profileCompletion = {
      withBio: await prisma.workerProfile.count({
        where: {
          user: { role: 'WORKER' },
          bio: { not: null }
        }
      }),
      withExperience: await prisma.workerProfile.count({
        where: {
          user: { role: 'WORKER' },
          experience: { not: null }
        }
      }),
      withSkills: candidatesWithSkills.length,
      withHourlyRate: await prisma.workerProfile.count({
        where: {
          user: { role: 'WORKER' },
          hourlyRate: { not: null }
        }
      })
    }

    return NextResponse.json({
      overview: {
        totalCandidates,
        candidatesWithResumes,
        candidatesWithPictures,
        profileCompletionRate: Math.round((profileCompletion.withBio / totalCandidates) * 100),
        averageHourlyRate: averageHourlyRate._avg.hourlyRate ? 
          Math.round(averageHourlyRate._avg.hourlyRate * 100) / 100 : null
      },
      
      marketTrends: {
        topSkills,
        rateDistribution,
        ratingDistribution: Object.entries(ratingDistribution).map(([category, count]) => ({
          category, count
        })),
        experienceDistribution: Object.entries(experienceDistribution).map(([level, count]) => ({
          level, count
        }))
      },
      
      recentActivity,
      
      profileCompletion: {
        ...profileCompletion,
        completionPercentages: {
          bio: Math.round((profileCompletion.withBio / totalCandidates) * 100),
          experience: Math.round((profileCompletion.withExperience / totalCandidates) * 100),
          skills: Math.round((profileCompletion.withSkills / totalCandidates) * 100),
          hourlyRate: Math.round((profileCompletion.withHourlyRate / totalCandidates) * 100)
        }
      },
      
      recommendations: {
        inDemandSkills: topSkills.slice(0, 5).map(skill => skill.skill),
        competitiveRateRange: rateDistribution
          .filter(range => range.count > 0)
          .sort((a, b) => b.count - a.count)[0]?.label || 'No data',
        suggestedSearchFilters: [
          'Filter by top skills for better matches',
          'Consider candidates with 4+ star ratings',
          'Look for candidates with resume uploads',
          'Focus on candidates with recent activity'
        ]
      },
      
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating candidate analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}