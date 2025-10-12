import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const bulkActionSchema = z.object({
  applicationIds: z.array(z.string()).min(1).max(20), // Limit to 20 applications at once
  action: z.enum(['ACCEPT', 'REJECT']),
  responseNote: z.string().optional(),
  scheduledStartTime: z.string().optional(),
  scheduledEndTime: z.string().optional()
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
    const { applicationIds, action, responseNote, scheduledStartTime, scheduledEndTime } = bulkActionSchema.parse(body)

    // Get restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Get all applications and verify ownership
    const applications = await prisma.application.findMany({
      where: {
        id: { in: applicationIds },
        restaurantId: restaurant.id
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            maxWorkers: true,
            startDate: true,
            endDate: true
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

    if (applications.length !== applicationIds.length) {
      return NextResponse.json(
        { error: 'Some applications not found or access denied' },
        { status: 400 }
      )
    }

    // Check that all applications are pending
    const nonPendingApplications = applications.filter((app: any) => app.status !== 'PENDING')
    if (nonPendingApplications.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some applications are not pending',
          nonPendingApplications: nonPendingApplications.map((app: any) => ({
            id: app.id,
            status: app.status,
            workerName: app.worker.user.name
          }))
        },
        { status: 400 }
      )
    }

    // Process bulk action in transaction
    const results = await prisma.$transaction(async (tx: any) => {
      const processedApplications = []
      const shiftAssignments = []
      const jobUpdates = new Map()

      for (const application of applications) {
        // Update application
        const updatedApplication = await tx.application.update({
          where: { id: application.id },
          data: {
            status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
            responseNote,
            respondedAt: new Date()
          }
        })

        processedApplications.push(updatedApplication)

        // Create shift assignment if accepted
        if (action === 'ACCEPT') {
          const startTime = scheduledStartTime ? new Date(scheduledStartTime) : application.job.startDate
          const endTime = scheduledEndTime ? new Date(scheduledEndTime) : application.job.endDate

          const shiftAssignment = await tx.shiftAssignment.create({
            data: {
              applicationId: application.id,
              jobId: application.jobId,
              workerId: application.workerId,
              restaurantId: application.restaurantId,
              startTime,
              endTime,
              status: 'SCHEDULED',
              notes: responseNote
            }
          })

          shiftAssignments.push(shiftAssignment)

          // Track job capacity for batch update
          const jobId = application.jobId
          if (!jobUpdates.has(jobId)) {
            jobUpdates.set(jobId, {
              job: application.job,
              acceptedCount: 0
            })
          }
          jobUpdates.get(jobId).acceptedCount++
        }
      }

      // Update job statuses if fully staffed
      const updatedJobs = []
      for (const [jobId, jobData] of jobUpdates) {
        const totalAccepted = await tx.application.count({
          where: {
            jobId: jobId,
            status: 'ACCEPTED'
          }
        })

        if (totalAccepted >= jobData.job.maxWorkers) {
          const updatedJob = await tx.job.update({
            where: { id: jobId },
            data: { status: 'FILLED' }
          })
          updatedJobs.push(updatedJob)
        }
      }

      return {
        processedApplications,
        shiftAssignments,
        updatedJobs
      }
    })

    // TODO: Send bulk notifications (implement in notification system)
    const notificationsSent = applications.map((app: any) => ({
      applicationId: app.id,
      workerId: app.worker.user.id,
      workerName: app.worker.user.name,
      sent: false // Will be true when notification system is implemented
    }))

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: results.processedApplications.length,
        action: action.toLowerCase(),
        shiftsCreated: results.shiftAssignments.length,
        jobsFilled: results.updatedJobs.length
      },
      details: {
        processedApplications: results.processedApplications.map((app: any) => ({
          id: app.id,
          status: app.status,
          respondedAt: app.respondedAt
        })),
        shiftAssignments: results.shiftAssignments.map((shift: any) => ({
          id: shift.id,
          applicationId: shift.applicationId,
          startTime: shift.startTime,
          endTime: shift.endTime
        })),
        updatedJobs: results.updatedJobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          status: job.status
        }))
      },
      notifications: notificationsSent,
      message: `Successfully ${action.toLowerCase()}ed ${results.processedApplications.length} application(s)`
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing bulk action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}