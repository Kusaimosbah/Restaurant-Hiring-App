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

    // Get general job statistics
    const stats = await prisma.job.groupBy({
      by: ['status', 'jobType', 'skillLevel', 'urgency'],
      where: {
        createdAt: {
          gte: dateFrom
        }
      },
      _count: {
        id: true
      }
    })

    // Get job posting trends over time
    const trendData = await prisma.job.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: dateFrom
        }
      },
      _count: {
        id: true
      },
      _avg: {
        hourlyRate: true
      }
    })

    // Restaurant owner specific stats
    let restaurantStats = null
    if (session.user.role === 'RESTAURANT_OWNER') {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      })

      if (restaurant) {
        restaurantStats = {
          totalJobs: await prisma.job.count({
            where: { restaurantId: restaurant.id }
          }),
          activeJobs: await prisma.job.count({
            where: { 
              restaurantId: restaurant.id,
              status: 'ACTIVE'
            }
          }),
          totalApplications: await prisma.application.count({
            where: {
              job: { restaurantId: restaurant.id }
            }
          }),
          recentJobs: await prisma.job.findMany({
            where: { restaurantId: restaurant.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              id: true,
              title: true,
              status: true,
              createdAt: true,
              _count: {
                select: {
                  applications: true
                }
              }
            }
          })
        }
      }
    }

    // Summary statistics
    const summary = {
      totalActiveJobs: await prisma.job.count({
        where: { status: 'ACTIVE' }
      }),
      averageHourlyRate: await prisma.job.aggregate({
        where: { 
          status: 'ACTIVE',
          hourlyRate: { gt: 0 }
        },
        _avg: {
          hourlyRate: true
        }
      }),
      topSkillLevels: stats
        .filter((stat: any) => stat.skillLevel)
        .sort((a: any, b: any) => b._count.id - a._count.id)
        .slice(0, 5),
      urgencyDistribution: stats
        .filter((stat: any) => stat.urgency)
        .reduce((acc: any, curr: any) => {
          acc[curr.urgency!] = curr._count.id
          return acc
        }, {}),
      jobTypeDistribution: stats
        .filter((stat: any) => stat.jobType)
        .reduce((acc: any, curr: any) => {
          acc[curr.jobType!] = curr._count.id
          return acc
        }, {})
    }

    return NextResponse.json({
      summary,
      trends: trendData,
      restaurantStats,
      timeframe: `${days} days`,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching job stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}