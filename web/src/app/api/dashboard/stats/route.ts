import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

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
      // Get restaurant stats for admin
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

      const [totalJobs, activeJobs, totalApplications, pendingApplications, totalWorkers, activeWorkers] = await Promise.all([
        prisma.job.count({
          where: { restaurantId: restaurant.id }
        }),
        prisma.job.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACTIVE'
          }
        }),
        prisma.application.count({
          where: { restaurantId: restaurant.id }
        }),
        prisma.application.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'PENDING'
          }
        }),
        prisma.application.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'ACCEPTED'
          }
        }),
        prisma.shiftAssignment.count({
          where: { 
            restaurantId: restaurant.id,
            status: 'SCHEDULED'
          }
        })
      ])

      return NextResponse.json({
        totalJobs,
        activeJobs,
        totalApplications,
        pendingApplications,
        totalWorkers,
        activeWorkers
      })
    } else {
      // Get worker stats
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

      const [activeJobs, totalApplications, pendingApplications] = await Promise.all([
        prisma.job.count({
          where: { status: 'ACTIVE' }
        }),
        prisma.application.count({
          where: { workerId: workerProfile.id }
        }),
        prisma.application.count({
          where: { 
            workerId: workerProfile.id,
            status: 'PENDING'
          }
        })
      ])

      return NextResponse.json({
        totalJobs: 0, // Not applicable for workers
        activeJobs,
        totalApplications,
        pendingApplications,
        totalWorkers: 0, // Not applicable for workers
        activeWorkers: 0 // Not applicable for workers
      })
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}