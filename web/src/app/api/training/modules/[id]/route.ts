import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/training/modules/[id]
 * Get a specific training module with materials and progress
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: moduleId } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get the module with materials
    const trainingModule = await prisma.trainingModule.findUnique({
      where: { id: moduleId },
      include: {
        materials: {
          orderBy: { order: 'asc' },
        },
        prerequisites: {
          select: {
            id: true,
            title: true,
          }
        },
        requiredFor: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    });
    
    if (!trainingModule) {
      return NextResponse.json(
        { error: 'Training module not found' },
        { status: 404 }
      );
    }
    
    // Get user's progress for this module
    const progress = await prisma.trainingProgress.findMany({
      where: {
        userId: session.user.id,
        moduleId: moduleId
      }
    });
    
    // Calculate module completion percentage
    const totalMaterials = trainingModule.materials.length;
    const completedMaterials = progress.filter(p => p.status === 'COMPLETED').length;
    const completionPercentage = totalMaterials > 0 
      ? Math.round((completedMaterials / totalMaterials) * 100) 
      : 0;

    // Check if prerequisites are completed
    let prerequisitesCompleted = true;
    if (trainingModule.prerequisites.length > 0) {
      const prerequisiteIds = trainingModule.prerequisites.map(p => p.id);      // For each prerequisite, check if all its materials are completed
      for (const prereqId of prerequisiteIds) {
        const prereqModule = await prisma.trainingModule.findUnique({
          where: { id: prereqId },
          include: {
            materials: {
              select: { id: true }
            }
          }
        });
        
        if (prereqModule) {
          const materialIds = prereqModule.materials.map(m => m.id);
          const completedPrereqMaterials = await prisma.trainingProgress.count({
            where: {
              userId: session.user.id,
              materialId: { in: materialIds },
              status: 'COMPLETED'
            }
          });
          
          if (completedPrereqMaterials < materialIds.length) {
            prerequisitesCompleted = false;
            break;
          }
        }
      }
    }
    
    // Map progress to materials
    const materialsWithProgress = trainingModule.materials.map(material => {
      const materialProgress = progress.find(p => p.materialId === material.id) || null;
      return {
        ...material,
        progress: materialProgress
      };
    });

    return NextResponse.json({
      ...trainingModule,
      materials: materialsWithProgress,
      progress: {
        completionPercentage,
        completedMaterials,
        totalMaterials,
        prerequisitesCompleted
      }
    });
  } catch (error) {
    console.error('Error fetching training module:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
