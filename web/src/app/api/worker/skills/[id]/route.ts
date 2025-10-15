import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating worker skill updates
const skillUpdateSchema = z.object({
  name: z.string().min(1, "Skill name is required").optional(),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  yearsOfExperience: z.number().optional().nullable(),
});

/**
 * GET /api/worker/skills/[id]
 * 
 * Retrieves a specific skill for the authenticated worker
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Get the skill and ensure it belongs to this worker
    const skill = await prisma.workerSkill.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Error retrieving worker skill:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker skill' }, { status: 500 });
  }
}

/**
 * PUT /api/worker/skills/[id]
 * 
 * Updates a specific skill for the authenticated worker
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can update skills' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = skillUpdateSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the skill exists and belongs to this worker
    const existingSkill = await prisma.workerSkill.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // If name is being changed, check if another skill with the same name already exists
    if (validatedData.name && validatedData.name !== existingSkill.name) {
      const duplicateSkill = await prisma.workerSkill.findFirst({
        where: {
          workerId: workerProfile.id,
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (duplicateSkill) {
        return NextResponse.json({ error: 'Another skill with this name already exists' }, { status: 400 });
      }
    }

    // Update the skill
    const updatedSkill = await prisma.workerSkill.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedSkill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating worker skill:', error);
    return NextResponse.json({ error: 'Failed to update worker skill' }, { status: 500 });
  }
}

/**
 * DELETE /api/worker/skills/[id]
 * 
 * Deletes a specific skill for the authenticated worker
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can delete skills' }, { status: 403 });
    }

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if the skill exists and belongs to this worker
    const existingSkill = await prisma.workerSkill.findFirst({
      where: {
        id,
        workerId: workerProfile.id,
      },
    });

    if (!existingSkill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    // Delete the skill
    await prisma.workerSkill.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting worker skill:', error);
    return NextResponse.json({ error: 'Failed to delete worker skill' }, { status: 500 });
  }
}
