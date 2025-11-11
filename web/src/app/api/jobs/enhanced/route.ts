import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Enhanced Jobs API - GET /api/jobs
 * Supports advanced filtering, sorting, and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Parse query parameters
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';
    const experienceLevel = searchParams.get('experienceLevel') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    const isAdmin = session.user.role === 'RESTAURANT_OWNER';
    
    // Build where clause
    const whereClause: any = {};
    
    if (isAdmin) {
      // Restaurant owners see only their jobs
      const restaurant = await prisma.restaurant.findUnique({
        where: { ownerId: session.user.id }
      });
      
      if (!restaurant) {
        return NextResponse.json({ jobs: [], total: 0 });
      }
      
      whereClause.restaurantId = restaurant.id;
    } else {
      // Workers see only published jobs
      whereClause.status = 'PUBLISHED';
    }

    // Apply filters
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { requirements: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderByClause: any = {};
    if (sortBy === 'createdAt') {
      orderByClause.createdAt = sortOrder;
    } else if (sortBy === 'title') {
      orderByClause.title = sortOrder;
    } else if (sortBy === 'hourlyRate') {
      orderByClause.hourlyRate = sortOrder;
    } else if (sortBy === 'applications') {
      orderByClause.applications = { _count: sortOrder };
    } else {
      orderByClause.createdAt = 'desc';
    }

    // Get total count
    const total = await prisma.job.count({ where: whereClause });

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where: whereClause,
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
        },
        ...(includeAnalytics && isAdmin ? {
          applications: {
            select: {
              id: true,
              status: true
            }
          }
        } : {})
      },
      orderBy: orderByClause,
      skip: (page - 1) * limit,
      take: limit
    });

    // Format jobs with analytics if requested
    const formattedJobs = jobs.map(job => {
      const baseJob = {
        ...job,
        restaurant: {
          ...job.restaurant,
          formattedAddress: job.restaurant.address
            ? `${job.restaurant.address.street}, ${job.restaurant.address.city}, ${job.restaurant.address.state} ${job.restaurant.address.zipCode}`
            : job.restaurant.name
        }
      };

      if (includeAnalytics && isAdmin && 'applications' in job) {
        const applications = job.applications as any[];
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const applicationsThisWeek = applications.filter(app => 
          new Date(app.createdAt) >= oneWeekAgo
        ).length;
        
        const respondedApplications = applications.filter(app => 
          app.status !== 'PENDING'
        ).length;
        
        return {
          ...baseJob,
          analytics: {
            views: Math.floor(Math.random() * 200) + 50, // Mock data - implement view tracking
            applicationsThisWeek,
            responseRate: applications.length > 0 ? Math.round((respondedApplications / applications.length) * 100) : 0,
            averageTimeToApply: Math.round(Math.random() * 48) + 2 // Mock data - implement time tracking
          }
        };
      }

      return baseJob;
    });

    return NextResponse.json({
      jobs: formattedJobs,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * Enhanced Jobs API - POST /api/jobs
 * Create new job with comprehensive validation
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      hourlyRate,
      startDate,
      endDate,
      maxWorkers,
      category,
      experienceLevel,
      benefits,
      tags,
      location,
      status = 'DRAFT'
    } = body;

    // Validation
    if (!title || !description || !hourlyRate || !startDate || !endDate || !maxWorkers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (new Date(startDate) >= new Date(endDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    if (hourlyRate < 0 || maxWorkers < 1) {
      return NextResponse.json(
        { error: 'Invalid hourly rate or max workers' },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements,
        hourlyRate: parseFloat(hourlyRate),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxWorkers: parseInt(maxWorkers),
        category,
        experienceLevel,
        benefits: benefits || [],
        tags: tags || [],
        location: location || {},
        status,
        restaurantId: restaurant.id,
        postedById: session.user.id
      },
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
      message: 'Job created successfully',
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
    console.error('Failed to create job:', error);
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    );
  }
}