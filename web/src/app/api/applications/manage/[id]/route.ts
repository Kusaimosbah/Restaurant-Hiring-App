import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const manageApplicationSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  responseNote: z.string().optional(),
  scheduledStartTime: z.string().optional(), // For accepted applications
  scheduledEndTime: z.string().optional()
})

export async function PATCH(
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

    const applicationId = params.id
    const body = await request.json()
    const { status, responseNote, scheduledStartTime, scheduledEndTime } = manageApplicationSchema.parse(body)

    // Get application with full details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            restaurant: true
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

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (application.job.restaurant.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied - You can only manage applications for your own jobs' },
        { status: 403 }
      )
    }

    // Check if application is still pending
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Application has already been ${application.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Start transaction for accepting applications
    const result = await prisma.$transaction(async (tx: any) => {
      // Update application status
      const updatedApplication = await tx.application.update({
        where: { id: applicationId },
        data: {
          status,
          responseNote,
          respondedAt: new Date()
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

      // If accepted, create shift assignment
      let shiftAssignment = null
      if (status === 'ACCEPTED') {
        const startTime = scheduledStartTime ? new Date(scheduledStartTime) : application.job.startDate
        const endTime = scheduledEndTime ? new Date(scheduledEndTime) : application.job.endDate

        shiftAssignment = await tx.shiftAssignment.create({
          data: {
            applicationId: applicationId,
            jobId: application.jobId,
            workerId: application.workerId,
            restaurantId: application.restaurantId,
            startTime,
            endTime,
            status: 'SCHEDULED',
            notes: responseNote
          }
        })

        // Check if job is now fully staffed
        const acceptedApplicationsCount = await tx.application.count({
          where: {
            jobId: application.jobId,
            status: 'ACCEPTED'
          }
        })

        // If job is fully staffed, update job status
        if (acceptedApplicationsCount >= application.job.maxWorkers) {
          await tx.job.update({
            where: { id: application.jobId },
            data: { status: 'FILLED' }
          })
        }
      }

      return { application: updatedApplication, shiftAssignment }
    })

    // TODO: Send notification to worker (will implement in notification system)
    console.log(`Application ${status.toLowerCase()} for ${application.worker.user.name}`)

    return NextResponse.json({
      application: result.application,
      shiftAssignment: result.shiftAssignment,
      message: `Application successfully ${status.toLowerCase()}`,
      notificationSent: false // Will be true when notification system is implemented
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error managing application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get detailed application information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const applicationId = params.id

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                address: true,
                description: true,
                phone: true,
                email: true
              }
            }
          }
        },
        worker: {
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
              },
              take: 5
            },
            applications: {
              where: {
                status: 'ACCEPTED'
              },
              include: {
                job: {
                  select: {
                    title: true,
                    jobType: true
                  }
                },
                restaurant: {
                  select: {
                    name: true
                  }
                }
              },
              orderBy: {
                appliedAt: 'desc'
              },
              take: 5
            },
            _count: {
              select: {
                applications: true,
                shiftAssignments: true,
                reviewsReceived: true
              }
            }
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true,
            ownerId: true
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        shiftAssignment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            notes: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Verify access permissions
    const isWorkerOwner = session.user.role === 'WORKER' && application.worker.user.id === session.user.id
    const isRestaurantOwner = session.user.role === 'RESTAURANT_OWNER' && application.restaurant.ownerId === session.user.id

    if (!isWorkerOwner && !isRestaurantOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Calculate worker statistics
    const reviews = application.worker.reviewsReceived
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
      : null

    const workerStats = {
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      totalReviews: application.worker._count.reviewsReceived,
      totalApplications: application.worker._count.applications,
      totalShiftsCompleted: application.worker._count.shiftAssignments,
      completionRate: application.worker._count.applications > 0 
        ? Math.round((application.worker.applications.length / application.worker._count.applications) * 100)
        : 0
    }

    return NextResponse.json({
      application,
      workerStats,
      canManage: isRestaurantOwner,
      timeline: [
        {
          type: 'application',
          date: application.appliedAt,
          description: 'Application submitted',
          status: 'completed'
        },
        ...(application.respondedAt ? [{
          type: 'response',
          date: application.respondedAt,
          description: `Application ${application.status.toLowerCase()}`,
          status: 'completed'
        }] : []),
        ...(application.shiftAssignment ? [{
          type: 'scheduling',
          date: application.respondedAt || new Date(),
          description: 'Shift scheduled',
          status: 'completed'
        }] : [])
      ]
    })

  } catch (error) {
    console.error('Error fetching application details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}