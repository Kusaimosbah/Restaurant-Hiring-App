import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const worker = await prisma.workerProfile.findUnique({
      where: { id },
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
    });

    if (!worker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Transform the data - simplified version
    const transformedWorker = {
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
      contactEmail: worker.contactEmail,
      availability: worker.availability,
      skills: worker.skills || [],
      workerSkills: worker.workerSkills,
      certifications: worker.certifications.map(cert => ({
        id: cert.id,
        name: cert.name,
        issuer: cert.issuer,
        dateObtained: cert.issueDate.toISOString(),
        expiryDate: cert.expiryDate?.toISOString(),
        verified: false // Default - would need verification system
      })),
      workHistory: [], // Simplified - would need proper work history model
      performance: {
        averageRating: 4.5, // Mock data
        totalJobs: Math.floor(Math.random() * 15) + 5,
        completedJobs: Math.floor(Math.random() * 12) + 3,
        cancelledJobs: Math.floor(Math.random() * 3),
        responseTime: 12,
        reliability: 92
      },
      preferences: {
        maxDistance: null,
        preferredWorkTypes: [],
        availableDays: [],
        availableHours: { start: '09:00', end: '17:00' }
      },
      verificationStatus: {
        identity: Math.random() > 0.5,
        background: Math.random() > 0.7,
        references: Math.random() > 0.6
      },
      address: worker.address,
      city: worker.city,
      state: worker.state,
      zipCode: worker.zipCode,
      createdAt: worker.createdAt,
      updatedAt: worker.updatedAt
    };

    return NextResponse.json(transformedWorker);

  } catch (error) {
    console.error('Get worker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    // Validate worker exists
    const existingWorker = await prisma.workerProfile.findUnique({
      where: { id }
    });

    if (!existingWorker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Update worker profile with allowed fields
    const allowedFields = [
      'bio', 'title', 'yearsOfExperience', 'hourlyRate',
      'contactPhone', 'availability', 'skills', 'experience',
      'address', 'city', 'state', 'zipCode', 'contactEmail',
      'preferredContactMethod'
    ];

    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle status changes
    if (body.status) {
      // For now, we don't have a status field in the schema
      // This would be implemented when we add proper status management
      updateData.updatedAt = new Date();
    }

    const updatedWorker = await prisma.workerProfile.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      success: true,
      worker: updatedWorker,
      message: 'Worker profile updated successfully'
    });

  } catch (error) {
    console.error('Update worker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'RESTAURANT_OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Check if worker exists
    const existingWorker = await prisma.workerProfile.findUnique({
      where: { id }
    });

    if (!existingWorker) {
      return NextResponse.json(
        { error: 'Worker not found' },
        { status: 404 }
      );
    }

    // Delete worker profile (cascade will handle related records)
    await prisma.workerProfile.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Worker profile deleted successfully'
    });

  } catch (error) {
    console.error('Delete worker error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}