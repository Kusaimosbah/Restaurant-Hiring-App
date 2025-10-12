import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Unauthorized - Worker access required' },
        { status: 401 }
      )
    }

    const applicationId = params.id

    // Get worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!workerProfile) {
      return NextResponse.json(
        { error: 'Worker profile not found' },
        { status: 404 }
      )
    }

    // Get application
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            status: true
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
    if (application.workerId !== workerProfile.id) {
      return NextResponse.json(
        { error: 'Access denied - You can only withdraw your own applications' },
        { status: 403 }
      )
    }

    // Check if application can be withdrawn
    if (application.status === 'WITHDRAWN') {
      return NextResponse.json(
        { error: 'Application is already withdrawn' },
        { status: 400 }
      )
    }

    if (application.status === 'ACCEPTED') {
      return NextResponse.json(
        { error: 'Cannot withdraw an accepted application. Please contact the restaurant.' },
        { status: 400 }
      )
    }

    // Withdraw the application
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'WITHDRAWN',
        respondedAt: new Date()
      },
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        },
        restaurant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    // TODO: Send notification to restaurant owner (will implement in notification system)
    console.log(`Application withdrawn for job: ${application.job.title}`)

    return NextResponse.json({
      application: updatedApplication,
      message: 'Application successfully withdrawn',
      notificationSent: false // Will be true when notification system is implemented
    })

  } catch (error) {
    console.error('Error withdrawing application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}