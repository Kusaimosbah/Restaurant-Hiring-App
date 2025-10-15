import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating worker profile updates
const workerProfileSchema = z.object({
  bio: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  yearsOfExperience: z.number().optional().nullable(),
  hourlyRate: z.number().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  preferredContactMethod: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),
  profilePictureUrl: z.string().optional().nullable(),
});

/**
 * GET /api/worker/profile
 * 
 * Retrieves the worker profile for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can access this endpoint' }, { status: 403 });
    }

    // Get the worker profile with related data
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    return NextResponse.json(workerProfile);
  } catch (error) {
    console.error('Error retrieving worker profile:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker profile' }, { status: 500 });
  }
}

/**
 * PUT /api/worker/profile
 * 
 * Updates the worker profile for the authenticated user
 */
export async function PUT(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can update their profile' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = workerProfileSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Update the worker profile
    const updatedProfile = await prisma.workerProfile.update({
      where: { id: workerProfile.id },
      data: validatedData,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating worker profile:', error);
    return NextResponse.json({ error: 'Failed to update worker profile' }, { status: 500 });
  }
}
