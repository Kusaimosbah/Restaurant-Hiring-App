import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/jobs/[id]
 * Get individual job details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const job = await prisma.job.findUnique({
      where: { id: params.id },
      include: {
        restaurant: {
          include: {
            address: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const isAdmin = session.user.role === 'RESTAURANT_OWNER';
    if (isAdmin) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      });
      
      if (!restaurant || job.restaurantId !== restaurant.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
    } else if (job.status !== 'ACTIVE') {
      // Workers can only see published jobs
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      job: {
        ...job,
        restaurant: {
          ...job.restaurant,
          formattedAddress: job.restaurant.address
            ? `${job.restaurant.address.street}, ${job.restaurant.address.city}, ${job.restaurant.address.state} ${job.restaurant.address.zipCode}`
            : job.restaurant.name
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update job details
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owners only' },
        { status: 401 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Check if job exists and belongs to restaurant
    const existingJob = await prisma.job.findUnique({
      where: { id: params.id }
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (existingJob.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      hourlyRate,
      startDate,
      endDate,
      maxWorkers,
      status
    } = body;

    // Validation
    const updateData: any = {};
    
    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return NextResponse.json(
          { error: 'Description is required' },
          { status: 400 }
        );
      }
      updateData.description = description;
    }

    if (requirements !== undefined) {
      updateData.requirements = requirements;
    }

    if (hourlyRate !== undefined) {
      if (hourlyRate < 0) {
        return NextResponse.json(
          { error: 'Hourly rate must be positive' },
          { status: 400 }
        );
      }
      updateData.hourlyRate = parseFloat(hourlyRate);
    }

    if (startDate !== undefined) {
      updateData.startDate = new Date(startDate);
    }

    if (endDate !== undefined) {
      updateData.endDate = new Date(endDate);
    }

    if (maxWorkers !== undefined) {
      if (maxWorkers < 1) {
        return NextResponse.json(
          { error: 'Max workers must be at least 1' },
          { status: 400 }
        );
      }
      updateData.maxWorkers = parseInt(maxWorkers);
    }

    if (status !== undefined) {
      const validStatuses = ['ACTIVE', 'PAUSED', 'CLOSED', 'DRAFT'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Validate dates if both are provided
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate >= updateData.endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    } else if (updateData.startDate && existingJob.endDate) {
      if (updateData.startDate >= existingJob.endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    } else if (updateData.endDate && existingJob.startDate) {
      if (existingJob.startDate >= updateData.endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Update job
    const updatedJob = await prisma.job.update({
      where: { id: params.id },
      data: updateData,
      include: {
        restaurant: {
          include: {
            address: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Job updated successfully',
      job: {
        ...updatedJob,
        restaurant: {
          ...updatedJob.restaurant,
          formattedAddress: updatedJob.restaurant.address
            ? `${updatedJob.restaurant.address.street}, ${updatedJob.restaurant.address.city}, ${updatedJob.restaurant.address.state} ${updatedJob.restaurant.address.zipCode}`
            : updatedJob.restaurant.name
        }
      }
    });

  } catch (error) {
    console.error('Failed to update job:', error);
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized - Restaurant owners only' },
        { status: 401 }
      );
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Check if job exists and belongs to restaurant
    const job = await prisma.job.findUnique({
      where: { id: params.id }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete job and related applications
    await prisma.$transaction([
      prisma.application.deleteMany({
        where: { jobId: params.id }
      }),
      prisma.job.delete({
        where: { id: params.id }
      })
    ]);

    return NextResponse.json({
      message: 'Job deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}