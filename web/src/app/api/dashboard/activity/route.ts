import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get filter from query params
    const url = new URL(request.url)
    const filterType = url.searchParams.get('type')
    const limit = parseInt(url.searchParams.get('limit') || '10', 10)

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
      const recentApplications = filterType && filterType !== 'application' ? [] : 
        await prisma.application.findMany({
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
          take: limit
      })

      // Get recent jobs
      const recentJobs = filterType && filterType !== 'job' ? [] :
        await prisma.job.findMany({
        where: { restaurantId: restaurant.id },
        orderBy: { createdAt: 'desc' },
          take: limit
        })

      // Get recent worker activity
      const recentWorkerActivity = filterType && filterType !== 'worker' ? [] :
        await prisma.shiftAssignment.findMany({
          where: { restaurantId: restaurant.id },
          include: {
            worker: {
              include: {
                user: true
              }
            },
            job: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

      // Get recent messages
      const recentMessages = filterType && filterType !== 'message' ? [] :
        await prisma.message.findMany({
          where: { 
            OR: [
              { senderId: session.user.id },
              { receiverId: session.user.id }
            ]
          },
          include: {
            sender: true,
            receiver: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

      // Get recent reviews
      const recentReviews = filterType && filterType !== 'review' ? [] :
        await prisma.review.findMany({
          where: { restaurantId: restaurant.id },
          include: {
            worker: {
              include: {
                user: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: limit
      })

      const activities = [
        ...recentApplications.map(app => ({
          id: app.id,
          type: 'application' as const,
          message: `${app.worker.user.name} applied for ${app.job.title} position`,
          time: formatTimeAgo(app.appliedAt),
          details: app.coverLetter || `Experience: ${app.worker.yearsOfExperience} years`,
          link: `/dashboard/applications?id=${app.id}`
        })),
        ...recentJobs.map(job => ({
          id: job.id,
          type: 'job' as const,
          message: `${job.title} position was posted`,
          time: formatTimeAgo(job.createdAt),
          details: `${job.description?.substring(0, 100)}${job.description?.length > 100 ? '...' : ''}`,
          link: `/dashboard/jobs?id=${job.id}`
        })),
        ...recentWorkerActivity.map(shift => ({
          id: shift.id,
          type: 'worker' as const,
          message: `${shift.worker.user.name} was assigned to ${shift.job.title}`,
          time: formatTimeAgo(shift.createdAt),
          details: `Shift: ${formatDate(shift.startTime)} - ${formatTime(shift.startTime)} to ${formatTime(shift.endTime)}`,
          link: `/dashboard/workers?id=${shift.workerId}`
        })),
        ...recentMessages.map(msg => ({
          id: msg.id,
          type: 'message' as const,
          message: msg.senderId === session.user.id 
            ? `You sent a message to ${msg.receiver.name}`
            : `You received a message from ${msg.sender.name}`,
          time: formatTimeAgo(msg.createdAt),
          details: `${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`,
          link: `/dashboard/messages?id=${msg.conversationId}`
        })),
        ...recentReviews.map(review => ({
          id: review.id,
          type: 'review' as const,
          message: `${review.worker.user.name} left a ${review.rating}-star review`,
          time: formatTimeAgo(review.createdAt),
          details: review.comment,
          link: `/dashboard/reviews?id=${review.id}`
        }))
      ]
      .sort((a, b) => {
        const dateA = new Date(a.time.replace(' ago', ''))
        const dateB = new Date(b.time.replace(' ago', ''))
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, limit)

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

      // Get recent applications
      const recentApplications = filterType && filterType !== 'application' ? [] :
        await prisma.application.findMany({
        where: { workerId: workerProfile.id },
        include: {
          job: {
            include: {
              restaurant: true
            }
          }
        },
        orderBy: { appliedAt: 'desc' },
          take: limit
        })

      // Get recent shifts
      const recentShifts = filterType && filterType !== 'shift' ? [] :
        await prisma.shiftAssignment.findMany({
          where: { workerId: workerProfile.id },
          include: {
            job: true,
            restaurant: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

      // Get recent messages
      const recentMessages = filterType && filterType !== 'message' ? [] :
        await prisma.message.findMany({
          where: { 
            OR: [
              { senderId: session.user.id },
              { receiverId: session.user.id }
            ]
          },
          include: {
            sender: true,
            receiver: true
          },
          orderBy: { createdAt: 'desc' },
          take: limit
        })

      // Get recent profile updates
      const recentUpdates = filterType && filterType !== 'profile' ? [] :
        await prisma.workerProfile.findMany({
          where: { 
            id: workerProfile.id,
            updatedAt: {
              gt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: limit
        })

      const activities = [
        ...recentApplications.map(app => {
          let message = `You applied for ${app.job.title} at ${app.job.restaurant.name}`
        if (app.status === 'ACCEPTED') {
            message = `Your application for ${app.job.title} was approved`
        } else if (app.status === 'REJECTED') {
            message = `Your application for ${app.job.title} was declined`
          } else if (app.status === 'INTERVIEWING') {
            message = `You have an interview for ${app.job.title}`
        }

        return {
          id: app.id,
          type: 'application' as const,
          message,
            time: formatTimeAgo(app.appliedAt),
            details: app.coverLetter || `Status: ${app.status}`,
            link: `/dashboard/applications?id=${app.id}`
          }
        }),
        ...recentShifts.map(shift => ({
          id: shift.id,
          type: 'shift' as const,
          message: `Shift assigned: ${shift.job.title} at ${shift.restaurant.name}`,
          time: formatTimeAgo(shift.createdAt),
          details: `${formatDate(shift.startTime)}: ${formatTime(shift.startTime)} - ${formatTime(shift.endTime)}`,
          link: `/dashboard/schedule`
        })),
        ...recentMessages.map(msg => ({
          id: msg.id,
          type: 'message' as const,
          message: msg.senderId === session.user.id 
            ? `You sent a message to ${msg.receiver.name}`
            : `You received a message from ${msg.sender.name}`,
          time: formatTimeAgo(msg.createdAt),
          details: `${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`,
          link: `/dashboard/messages?id=${msg.conversationId}`
        })),
        ...recentUpdates.map(update => ({
          id: update.id,
          type: 'profile' as const,
          message: 'You updated your profile',
          time: formatTimeAgo(update.updatedAt),
          details: 'Profile information was updated',
          link: `/dashboard/profile/worker`
        }))
      ]
      .sort((a, b) => {
        const dateA = new Date(a.time.replace(' ago', ''))
        const dateB = new Date(b.time.replace(' ago', ''))
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, limit)

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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}