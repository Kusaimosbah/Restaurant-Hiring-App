import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simplified version for now - we'll create a more comprehensive API later
// This provides basic worker data to get the UI working

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || [];
    const availability = searchParams.get('availability') || '';
    const experience = searchParams.get('experience') || '';
    const sortBy = searchParams.get('sortBy') || 'lastActive';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build the where clause
    const whereClause: any = {
      user: {
        role: 'WORKER'
      }
    };

    // Search filter
    if (search) {
      whereClause.OR = [
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          bio: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          skills: {
            hasSome: [search]
          }
        }
      ];
    }

    // Skills filter
    if (skills.length > 0) {
      whereClause.skills = {
        hasEvery: skills
      };
    }

    // Availability filter
    if (availability) {
      whereClause.availability = availability;
    }

    // Experience filter
    if (experience) {
      const [min, max] = experience.split('-').map(num => num === '+' ? null : parseInt(num));
      if (max) {
        whereClause.yearsOfExperience = {
          gte: min,
          lte: max
        };
      } else if (min !== null) {
        whereClause.yearsOfExperience = {
          gte: min
        };
      }
    }

    // Build the orderBy clause
    let orderBy: any = {};
    switch (sortBy) {
      case 'experience':
        orderBy = { yearsOfExperience: sortOrder };
        break;
      case 'hourlyRate':
        orderBy = { hourlyRate: sortOrder };
        break;
      case 'rating':
      case 'totalJobs':
      case 'lastActive':
      default:
        orderBy = { updatedAt: sortOrder };
        break;
    }

    // Get workers with pagination - simplified query for now
    const [workers, totalCount] = await Promise.all([
      prisma.workerProfile.findMany({
        where: whereClause,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          workerSkills: {
            select: {
              name: true,
              level: true,
              yearsExperience: true
            }
          },
          certifications: {
            select: {
              id: true,
              name: true,
              issuer: true,
              issueDate: true,
              expiryDate: true
            }
          }
        }
      }),
      prisma.workerProfile.count({ where: whereClause })
    ]);

    // Transform the data to match the frontend interface
    const transformedWorkers = workers.map(worker => {
      return {
        id: worker.id,
        user: {
          id: worker.user.id,
          name: worker.user.name,
          email: worker.user.email,
          profilePictureUrl: worker.profilePictureUrl
        },
        bio: worker.bio,
        title: worker.title,
        yearsOfExperience: worker.yearsOfExperience,
        experience: worker.experience || (worker.yearsOfExperience ? `${worker.yearsOfExperience} years` : undefined),
        hourlyRate: worker.hourlyRate,
        contactPhone: worker.contactPhone,
        availability: worker.availability,
        skills: worker.skills || [],
        certifications: worker.certifications.map(cert => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuer,
          dateObtained: cert.issueDate.toISOString(),
          expiryDate: cert.expiryDate?.toISOString(),
          verified: false // Default - would need verification system
        })),
        workHistory: [], // Would need work history model
        performance: {
          averageRating: 4.5, // Mock data for now
          totalJobs: Math.floor(Math.random() * 20) + 1,
          completedJobs: Math.floor(Math.random() * 15) + 1,
          cancelledJobs: Math.floor(Math.random() * 3),
          responseTime: Math.floor(Math.random() * 12) + 2,
          reliability: Math.floor(Math.random() * 20) + 80
        },
        preferences: {
          maxDistance: null,
          preferredWorkTypes: [],
          availableDays: [],
          availableHours: { start: '09:00', end: '17:00' }
        },
        verificationStatus: {
          identity: Math.random() > 0.5, // Mock verification status
          background: Math.random() > 0.7,
          references: Math.random() > 0.6
        },
        status: 'ACTIVE',
        createdAt: worker.createdAt,
        updatedAt: worker.updatedAt
      };
    });

    return NextResponse.json({
      workers: transformedWorkers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      },
      filters: {
        search,
        skills,
        availability,
        rating: '',
        experience,
        verified: '',
        sortBy,
        sortOrder
      }
    });

  } catch (error) {
    console.error('Workers API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      bio,
      title,
      yearsOfExperience,
      hourlyRate,
      contactPhone,
      availability,
      skills
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists and is a worker
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'WORKER') {
      return NextResponse.json(
        { error: 'Invalid user or user is not a worker' },
        { status: 400 }
      );
    }

    // Check if worker profile already exists
    const existingProfile = await prisma.workerProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Worker profile already exists' },
        { status: 409 }
      );
    }

    // Create worker profile with current schema fields
    const workerProfile = await prisma.workerProfile.create({
      data: {
        userId,
        bio,
        title,
        yearsOfExperience,
        hourlyRate,
        contactPhone,
        availability,
        skills: skills || [],
        // Use current schema fields
        experience: yearsOfExperience ? `${yearsOfExperience} years` : undefined,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        contactEmail: user.email,
        preferredContactMethod: 'email'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(workerProfile, { status: 201 });

  } catch (error) {
    console.error('Create worker profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}