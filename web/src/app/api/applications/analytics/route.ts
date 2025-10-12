import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
    const timeframe = searchParams.get('timeframe') || '30' // days
    const days = parseInt(timeframe)
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    let statsScope: any = {}
    let userContext = {}

    // Set scope based on user role
    if (session.user.role === 'WORKER') {
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: session.user.id }
      })
      if (!workerProfile) {
        return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 })
      }
      statsScope.workerId = workerProfile.id
      userContext = { role: 'worker', profileId: workerProfile.id }
    } else if (session.user.role === 'RESTAURANT_OWNER') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      })
      if (!restaurant) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
      }
      statsScope.restaurantId = restaurant.id
      userContext = { role: 'restaurant', restaurantId: restaurant.id }
    }

    // Application status distribution
    const statusDistribution = await prisma.application.groupBy({
      by: ['status'],
      where: {
        ...statsScope,
        appliedAt: {
          gte: dateFrom
        }
      },
      _count: {
        status: true
      }
    })

    const statusStats = statusDistribution.reduce((acc: any, curr: any) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {})

    // Recent applications trend (daily for last week)
    const last7Days = new Date()
    last7Days.setDate(last7Days.getDate() - 7)

    const dailyApplications = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)

      const count = await prisma.application.count({
        where: {
          ...statsScope,
          appliedAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      })

      dailyApplications.push({
        date: startOfDay.toISOString().split('T')[0],
        count
      })
    }

    // Response time analytics (for restaurant owners)
    let responseTimeStats = null
    if (session.user.role === 'RESTAURANT_OWNER') {
      const respondedApplications = await prisma.application.findMany({
        where: {
          ...statsScope,
          respondedAt: { not: null },
          appliedAt: {
            gte: dateFrom
          }
        },
        select: {
          appliedAt: true,
          respondedAt: true
        }
      })

      const responseTimes = respondedApplications
        .filter((app: any) => app.respondedAt)
        .map((app: any) => {
          const applied = new Date(app.appliedAt).getTime()
          const responded = new Date(app.respondedAt).getTime()
          return (responded - applied) / (1000 * 60 * 60) // hours
        })

      responseTimeStats = {
        averageHours: responseTimes.length > 0 
          ? Math.round((responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length) * 10) / 10
          : null,
        medianHours: responseTimes.length > 0
          ? responseTimes.sort((a: number, b: number) => a - b)[Math.floor(responseTimes.length / 2)]
          : null,
        fastestHours: responseTimes.length > 0 ? Math.min(...responseTimes) : null,
        slowestHours: responseTimes.length > 0 ? Math.max(...responseTimes) : null
      }
    }

    // Success rate analytics (for workers)
    let successRateStats = null
    if (session.user.role === 'WORKER') {
      const totalApplications = await prisma.application.count({
        where: statsScope
      })

      const acceptedApplications = await prisma.application.count({
        where: {
          ...statsScope,
          status: 'ACCEPTED'
        }
      })

      const completedShifts = await prisma.shiftAssignment.count({
        where: {
          ...statsScope,
          status: 'COMPLETED'
        }
      })

      successRateStats = {
        applicationSuccessRate: totalApplications > 0 
          ? Math.round((acceptedApplications / totalApplications) * 100)
          : 0,
        shiftsCompleted: completedShifts,
        averageApplicationsPerAcceptance: acceptedApplications > 0 
          ? Math.round(totalApplications / acceptedApplications * 10) / 10
          : 0
      }
    }

    // Job type preferences/performance
    const jobTypeStats = await prisma.application.groupBy({
      by: ['jobId'],
      where: {
        ...statsScope,
        appliedAt: {
          gte: dateFrom
        }
      },
      _count: {
        jobId: true
      }
    })

    // Get job types for these applications
    const jobIds = jobTypeStats.map((stat: any) => stat.jobId)
    const jobTypes = await prisma.job.groupBy({
      by: ['jobType'],
      where: {
        id: { in: jobIds }
      },
      _count: {
        jobType: true
      }
    })

    const jobTypeDistribution = jobTypes.reduce((acc: any, curr: any) => {
      acc[curr.jobType] = curr._count.jobType
      return acc
    }, {})

    // Recent activity summary
    const recentActivity = await prisma.application.findMany({
      where: {
        ...statsScope,
        appliedAt: {
          gte: dateFrom
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            jobType: true
          }
        },
        restaurant: session.user.role === 'WORKER' ? {
          select: {
            id: true,
            name: true
          }
        } : undefined,
        worker: session.user.role === 'RESTAURANT_OWNER' ? {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        } : undefined
      },
      orderBy: {
        appliedAt: 'desc'
      },
      take: 10
    })

    // Performance metrics
    const totalApplicationsInPeriod = await prisma.application.count({
      where: {
        ...statsScope,
        appliedAt: {
          gte: dateFrom
        }
      }
    })

    return NextResponse.json({
      overview: {
        totalApplications: totalApplicationsInPeriod,
        statusDistribution: statusStats,
        timeframe: `${days} days`
      },
      
      trends: {
        dailyApplications,
        jobTypeDistribution
      },
      
      performance: {
        responseTime: responseTimeStats,
        successRate: successRateStats
      },
      
      recentActivity: recentActivity.map((app: any) => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        respondedAt: app.respondedAt,
        job: app.job,
        restaurant: app.restaurant,
        worker: app.worker
      })),
      
      insights: {
        mostActiveDay: dailyApplications.length > 0 
          ? dailyApplications.reduce((max, day) => day.count > max.count ? day : max)
          : null,
        
        recommendedActions: session.user.role === 'WORKER' 
          ? [
              totalApplicationsInPeriod === 0 ? 'Start applying to jobs that match your skills' : null,
              successRateStats && successRateStats.applicationSuccessRate < 20 ? 'Consider improving your profile and application messages' : null,
              'Check job matches in the candidate search to find better opportunities'
            ].filter(Boolean)
          : [
              responseTimeStats && responseTimeStats.averageHours && responseTimeStats.averageHours > 48 ? 'Try to respond to applications faster to improve candidate experience' : null,
              statusStats.PENDING > 10 ? 'You have many pending applications that need review' : null,
              'Use the candidate matching feature to find better candidates'
            ].filter(Boolean)
      },
      
      userContext,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error generating application analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}