import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/training/materials/[id]
 * Get a specific training material with user progress
 */
export async function GET(
  request: Request,
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
    
    const materialId = params.id;
    
    // Get the material
    const material = await prisma.trainingMaterial.findUnique({
      where: { id: materialId },
      include: {
        module: {
          select: {
            id: true,
            title: true,
            description: true,
            targetRole: true,
            materials: {
              select: {
                id: true,
                title: true,
                order: true
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Training material not found' },
        { status: 404 }
      );
    }
    
    // Check if user has access to this material (role check)
    if (material.module.targetRole !== session.user.role) {
      return NextResponse.json(
        { error: 'You do not have access to this training material' },
        { status: 403 }
      );
    }
    
    // Get or create user's progress for this material
    let progress = await prisma.trainingProgress.findUnique({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId: materialId
        }
      }
    });
    
    if (!progress) {
      // Create initial progress record
      progress = await prisma.trainingProgress.create({
        data: {
          userId: session.user.id,
          materialId: materialId,
          moduleId: material.module.id,
          status: 'NOT_STARTED'
        }
      });
    }
    
    // If this is the first view, update to IN_PROGRESS
    if (progress.status === 'NOT_STARTED') {
      progress = await prisma.trainingProgress.update({
        where: { id: progress.id },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          lastAccessedAt: new Date()
        }
      });
    } else {
      // Update last accessed time
      progress = await prisma.trainingProgress.update({
        where: { id: progress.id },
        data: {
          lastAccessedAt: new Date()
        }
      });
    }
    
    // Find next and previous materials in the module
    const moduleId = material.module.id;
    const currentOrder = material.order;
    
    const nextMaterial = await prisma.trainingMaterial.findFirst({
      where: {
        moduleId,
        order: { gt: currentOrder }
      },
      orderBy: { order: 'asc' },
      select: { id: true, title: true }
    });
    
    const previousMaterial = await prisma.trainingMaterial.findFirst({
      where: {
        moduleId,
        order: { lt: currentOrder }
      },
      orderBy: { order: 'desc' },
      select: { id: true, title: true }
    });
    
    return NextResponse.json({
      ...material,
      progress,
      navigation: {
        next: nextMaterial,
        previous: previousMaterial
      }
    });
  } catch (error) {
    console.error('Error fetching training material:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/training/materials/[id]
 * Update user progress for a training material
 */
export async function PUT(
  request: Request,
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
    
    const materialId = params.id;
    const { status, timeSpentMinutes, score } = await request.json();
    
    // Validate the material exists
    const material = await prisma.trainingMaterial.findUnique({
      where: { id: materialId },
      select: { id: true, moduleId: true }
    });
    
    if (!material) {
      return NextResponse.json(
        { error: 'Training material not found' },
        { status: 404 }
      );
    }
    
    // Update progress
    const updateData: any = {
      lastAccessedAt: new Date()
    };
    
    if (status) {
      updateData.status = status;
      
      // If marking as completed, set completedAt
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    
    if (timeSpentMinutes !== undefined) {
      updateData.timeSpentMinutes = timeSpentMinutes;
    }
    
    if (score !== undefined) {
      updateData.score = score;
    }
    
    // Update or create progress record
    const progress = await prisma.trainingProgress.upsert({
      where: {
        userId_materialId: {
          userId: session.user.id,
          materialId: materialId
        }
      },
      update: updateData,
      create: {
        userId: session.user.id,
        materialId: materialId,
        moduleId: material.moduleId,
        status: status || 'IN_PROGRESS',
        startedAt: new Date(),
        completedAt: status === 'COMPLETED' ? new Date() : null,
        lastAccessedAt: new Date(),
        timeSpentMinutes: timeSpentMinutes || 0,
        score: score || null
      }
    });
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating training progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
