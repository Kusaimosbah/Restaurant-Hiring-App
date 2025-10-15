import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// Schema for validating worker skill creation
const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  yearsOfExperience: z.number().optional().nullable(),
});

/**
 * GET /api/worker/skills
 * 
 * Retrieves all skills for the authenticated worker
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

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Get all skills for this worker
    const skills = await prisma.workerSkill.findMany({
      where: { workerId: workerProfile.id },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error('Error retrieving worker skills:', error);
    return NextResponse.json({ error: 'Failed to retrieve worker skills' }, { status: 500 });
  }
}

/**
 * POST /api/worker/skills
 * 
 * Creates a new skill for the authenticated worker
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user session
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a worker
    if (session.user.role !== 'WORKER') {
      return NextResponse.json({ error: 'Forbidden - Only workers can create skills' }, { status: 403 });
    }

    // Parse and validate the request body
    const body = await req.json();
    const validatedData = skillSchema.parse(body);

    // Get the worker profile
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // Check if skill with the same name already exists
    const existingSkill = await prisma.workerSkill.findFirst({
      where: {
        workerId: workerProfile.id,
        name: validatedData.name,
      },
    });

    if (existingSkill) {
      return NextResponse.json({ error: 'Skill with this name already exists' }, { status: 400 });
    }

    // Create the new skill
    const newSkill = await prisma.workerSkill.create({
      data: {
        ...validatedData,
        workerId: workerProfile.id,
      },
    });

    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating worker skill:', error);
    return NextResponse.json({ error: 'Failed to create worker skill' }, { status: 500 });
  }
}
