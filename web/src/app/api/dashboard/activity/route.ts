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
      // Get recent activity for restaurant owner
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

      // Get recent applications
      const recentApplications = await prisma.application.findMany({
        where: { restaurantId: restaurant.id },
        include: {
          worker: {
            include: {
              user: true
            }
          },
          job: true
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
      })

      // Get recent jobs
      const recentJobs = await prisma.job.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
        take: 3
      })

      const activities = [
        ...recentApplications.map(app => ({
          id: app.id,
          type: 'application' as const,
          message: `${app.worker.user.name} applied for ${app.job.title} position`,
          time: formatTimeAgo(app.appliedAt)
        })),
        ...recentJobs.map(job => ({
          id: job.id,
          type: 'job' as const,
          message: `${job.title} position was posted`,
          time: formatTimeAgo(job.createdAt)
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5)

      return NextResponse.json(activities)
    } else {
      // Get recent activity for worker
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

      const recentApplications = await prisma.application.findMany({
        where: { workerId: workerProfile.id },
        include: {
          job: {
            include: {
              restaurant: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: 5
      })

      const activities = recentApplications.map(app => {
        let message = `You applied for ${app.job.title} position`
        if (app.status === 'ACCEPTED') {
          message = `Your application for ${app.job.title} position was approved`
        } else if (app.status === 'REJECTED') {
          message = `Your application for ${app.job.title} position was declined`
        }

        return {
          id: app.id,
          type: 'application' as const,
          message,
          time: formatTimeAgo(app.appliedAt)
        }
      })

      return NextResponse.json(activities)
    }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}