import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for search query parameters
const searchParamsSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  radius: z.coerce.number().optional(),
  minHourlyRate: z.coerce.number().optional(),
  maxHourlyRate: z.coerce.number().optional(),
  jobTypes: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['relevance', 'date', 'hourlyRate', 'distance']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    
    // Handle jobTypes as array
    if (params.jobTypes) {
      try {
        params.jobTypes = JSON.parse(params.jobTypes);
      } catch (e) {
        params.jobTypes = params.jobTypes.split(',');
      }
    }

    // Validate and parse query parameters
    const { 
      query, 
      location, 
      radius = 10,
      minHourlyRate = 0, 
      maxHourlyRate = 1000,
      jobTypes = [],
      startDate,
      endDate,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = searchParamsSchema.parse(params);

    // Build the where clause for the query
    const where: any = {
      status: 'ACTIVE',
    };

    // Filter by query (search in title and description)
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Filter by hourly rate
    if (minHourlyRate !== undefined) {
      where.hourlyRate = { gte: minHourlyRate };
    }
    if (maxHourlyRate !== undefined) {
      where.hourlyRate = { ...where.hourlyRate, lte: maxHourlyRate };
    }

    // Filter by job types (search in title)
    if (jobTypes && jobTypes.length > 0) {
      where.OR = [
        ...(where.OR || []),
        ...jobTypes.map((type: string) => ({
          title: { contains: type, mode: 'insensitive' },
        })),
      ];
    }

    // Filter by date range
    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }
    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    // Filter by location
    // In a real app, this would use geocoding and distance calculation
    // For now, we'll just do a simple text search on address
    if (location) {
      where.restaurant = {
        OR: [
          { address: { contains: location, mode: 'insensitive' } },
          { locations: { some: { city: { contains: location, mode: 'insensitive' } } } },
          { locations: { some: { state: { contains: location, mode: 'insensitive' } } } },
          { locations: { some: { zipCode: { contains: location, mode: 'insensitive' } } } },
        ],
      };
    }

    // Determine the sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'date':
        orderBy = { startDate: 'asc' };
        break;
      case 'hourlyRate':
        orderBy = { hourlyRate: 'desc' };
        break;
      case 'distance':
        // Would require actual distance calculation
        // For now, we'll just use the default sort
        break;
      case 'relevance':
      default:
        // For relevance, we'll use the default sort
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute the query
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          restaurant: {
            select: {
              id: true,
              name: true,
              address: true,
              locations: {
                select: {
                  id: true,
                  name: true,
                  street: true,
                  city: true,
                  state: true,
                  zipCode: true,
                  latitude: true,
                  longitude: true,
                },
              },
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // Check if the user has saved any of these jobs
    // In a real app, this would be stored in the database
    // For now, we'll just return the jobs without saved status

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error searching jobs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
