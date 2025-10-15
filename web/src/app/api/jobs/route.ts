import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { notifyNewJob } from '@/lib/utils/notificationUtils';

// Schema for job creation
const jobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  requirements: z.string().optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'Start date must be a valid date'
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'End date must be a valid date'
  }),
  status: z.enum(['DRAFT', 'ACTIVE', 'FILLED', 'CANCELLED']).default('ACTIVE'),
  maxWorkers: z.number().int().positive('Max workers must be a positive integer').default(1)
});

/**
 * GET /api/jobs
 * Get all jobs (with filtering)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);
    
    // Parse query parameters
    const status = url.searchParams.get('status');
    const restaurantId = url.searchParams.get('restaurantId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (restaurantId) {
      where.restaurantId = restaurantId;
    }
    
    // Get jobs with pagination
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ]);
    
    // Format jobs to include formatted address
    const formattedJobs = jobs.map(job => {
      const address = job.restaurant.address;
      const formattedAddress = address 
        ? `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`
        : 'No address provided';
        
      return {
        ...job,
        restaurant: {
          ...job.restaurant,
          formattedAddress
        }
      };
    });
    
    return NextResponse.json({
      jobs: formattedJobs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new job (for restaurant owners)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only restaurant owners can create jobs
    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = jobSchema.parse(body);

    // Get the restaurant for this owner
    const restaurant = await prisma.restaurant.findUnique({
      where: { ownerId: session.user.id }
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        restaurantId: restaurant.id
      }
    });

    // Find workers who might be interested in this job
    // In a real app, this would use more sophisticated matching
    const potentialWorkers = await prisma.workerProfile.findMany({
      take: 10, // Limit to 10 workers for demo purposes
      include: {
        user: true
      }
    });

    // Notify workers about the new job
    for (const worker of potentialWorkers) {
      await notifyNewJob(
        worker.userId,
        job.id,
        job.title,
        restaurant.name
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}