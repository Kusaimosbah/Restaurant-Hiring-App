import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

const applyJobSchema = z.object({
  jobId: z.string(),
  message: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, message } = applyJobSchema.parse(body)

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

    const job = await prisma.job.findUnique({
      where: {
        id: jobId
      },
      include: {
        restaurant: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    if (job.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Job is not active' },
        { status: 400 }
      )
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId: workerProfile.id
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Already applied to this job' },
        { status: 400 }
      )
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        restaurantId: job.restaurantId
      },
      include: {
        job: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true
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
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(application)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}