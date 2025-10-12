import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

// Enhanced validation schema for comprehensive job posting
const createJobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requirements: z.string().optional(),
  
  // Job type and classification
  jobType: z.enum(['SINGLE_SHIFT', 'WEEKLY_SHORT_TERM', 'PERMANENT']),
  skillLevel: z.enum(['NO_EXPERIENCE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  skillRequirements: z.array(z.string()).default([]),
  certificationRequirements: z.array(z.string()).default([]),
  
  // Compensation details
  hourlyRate: z.number().positive(),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  benefits: z.record(z.any()).optional(), // Flexible JSON for benefits
  
  // Scheduling
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  shiftStartTime: z.string().optional(), // Format: "HH:mm"
  shiftEndTime: z.string().optional(),   // Format: "HH:mm"
  workDays: z.array(z.string()).optional(), // ["MONDAY", "TUESDAY", etc.]
  
  // Capacity and urgency
  maxWorkers: z.number().positive().default(1),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  
  // Location (optional enhanced location data)
  locationAddress: z.string().optional(),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
  
  // Additional metadata
  isRemote: z.boolean().default(false),
  experienceMonths: z.number().min(0).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobType = searchParams.get('jobType')
    const skillLevel = searchParams.get('skillLevel')
    const urgency = searchParams.get('urgency')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build dynamic where clause for filtering
    const whereClause: any = {
      status: 'ACTIVE'
    }

    if (jobType) {
      whereClause.jobType = jobType
    }

    if (skillLevel) {
      whereClause.skillLevel = skillLevel
    }

    if (urgency) {
      whereClause.urgency = urgency
    }

    if (location) {
      // Search in location fields (address or restaurant address)
      whereClause.OR = [
        { locationAddress: { contains: location, mode: 'insensitive' } },
        { restaurant: { address: { contains: location, mode: 'insensitive' } } }
      ]
    }

    const jobs = await prisma.job.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            cuisine: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: [
        { urgency: 'desc' }, // High urgency jobs first
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count for pagination
    const totalJobs = await prisma.job.count({ where: whereClause })

    return NextResponse.json({
      jobs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalJobs / limit),
        totalJobs,
        hasNext: page * limit < totalJobs,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = createJobSchema.parse(body)

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

    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        requirements: data.requirements,
        
        // Job classification
        jobType: data.jobType,
        skillLevel: data.skillLevel,
        skillRequirements: data.skillRequirements,
        certificationRequirements: data.certificationRequirements,
        
        // Compensation
        hourlyRate: data.hourlyRate,
        salaryMin: data.salaryMin,
        salaryMax: data.salaryMax,
        benefits: data.benefits,
        
        // Scheduling
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        shiftStartTime: data.shiftStartTime,
        shiftEndTime: data.shiftEndTime,
        workDays: data.workDays,
        
        // Capacity and urgency
        maxWorkers: data.maxWorkers,
        urgency: data.urgency,
        
        // Location
        locationAddress: data.locationAddress,
        locationLatitude: data.locationLatitude,
        locationLongitude: data.locationLongitude,
        
        // Additional fields
        isRemote: data.isRemote,
        experienceMonths: data.experienceMonths,
        
        // Relations
        restaurantId: restaurant.id,
        status: 'ACTIVE'
      },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            address: true,
            cuisine: true
          }
        }
      }
    })

    return NextResponse.json(job)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}