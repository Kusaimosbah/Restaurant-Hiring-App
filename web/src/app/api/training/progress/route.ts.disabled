import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for progress filtering
const queryParamsSchema = z.object({
  moduleId: z.string().optional(),
  status: z.string().optional(),
});

/**
 * GET /api/training/progress
 * Get user's training progress
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    
    // Parse query parameters
    const queryResult = queryParamsSchema.safeParse({
      moduleId: url.searchParams.get('moduleId') || undefined,
      status: url.searchParams.get('status') || undefined,
    });
    
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }
    
    const { moduleId, status } = queryResult.data;
    
    // Build where clause
    const where: any = {
      userId: session.user.id
    };
    
    if (moduleId) {
      where.moduleId = moduleId;
    }
    
    if (status) {
      where.status = status;
    }
    
    // Get progress with material and module info
    const progress = await prisma.trainingProgress.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            title: true,
            type: true,
            moduleId: true
          }
        },
        module: {
          select: {
            id: true,
            title: true,
            targetRole: true
          }
        }
      },
      orderBy: {
        lastAccessedAt: 'desc'
      }
    });
    
    // Get summary statistics
    const totalModules = await prisma.trainingModule.count({
      where: {
        targetRole: session.user.role
      }
    });
    
    const completedModules = await prisma.trainingModule.count({
      where: {
        targetRole: session.user.role,
        materials: {
          every: {
            progress: {
              some: {
                userId: session.user.id,
                status: 'COMPLETED'
              }
            }
          }
        }
      }
    });
    
    const totalMaterials = await prisma.trainingMaterial.count({
      where: {
        module: {
          targetRole: session.user.role
        }
      }
    });
    
    const completedMaterials = await prisma.trainingProgress.count({
      where: {
        userId: session.user.id,
        status: 'COMPLETED'
      }
    });
    
    return NextResponse.json({
      progress,
      summary: {
        totalModules,
        completedModules,
        totalMaterials,
        completedMaterials,
        overallCompletionPercentage: totalMaterials > 0 
          ? Math.round((completedMaterials / totalMaterials) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('Error fetching training progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
