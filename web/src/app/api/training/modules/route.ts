import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schema for module filtering
const queryParamsSchema = z.object({
  targetRole: z.string().optional(),
  isRequired: z.string().optional().transform(val => val === 'true'),
  completed: z.string().optional().transform(val => val === 'true'),
});

/**
 * GET /api/training/modules
 * Get all training modules (with filtering)
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
      targetRole: url.searchParams.get('targetRole') || undefined,
      isRequired: url.searchParams.get('isRequired') || undefined,
      completed: url.searchParams.get('completed') || undefined,
    });
    
    if (!queryResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryResult.error.format() },
        { status: 400 }
      );
    }
    
    const { targetRole, isRequired, completed } = queryResult.data;
    
    // Build where clause
    const where: any = {};
    
    // Filter by target role if provided
    if (targetRole) {
      where.targetRole = targetRole;
    } else {
      // Default to user's role
      where.targetRole = session.user.role;
    }
    
    // Filter by required status if provided
    if (isRequired !== undefined) {
      where.isRequired = isRequired;
    }
    
    // Get modules with materials
    const modules = await prisma.trainingModule.findMany({
      where,
      include: {
        materials: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            order: true,
            estimatedTimeMinutes: true,
          }
        },
        prerequisites: {
          select: {
            id: true,
            title: true,
          }
        },
        _count: {
          select: {
            materials: true
          }
        }
      },
      orderBy: { order: 'asc' }
    });
    
    // If completed filter is provided, fetch progress data
    if (completed !== undefined) {
      // Get user's progress
      const progress = await prisma.trainingProgress.findMany({
        where: {
          userId: session.user.id,
          status: completed ? 'COMPLETED' : { not: 'COMPLETED' }
        },
        select: {
          moduleId: true,
          materialId: true,
          status: true
        }
      });
      
      // Group progress by module
      const progressByModule = progress.reduce((acc, item) => {
        if (!acc[item.moduleId]) {
          acc[item.moduleId] = [];
        }
        acc[item.moduleId].push(item);
        return acc;
      }, {} as Record<string, any[]>);
      
      // Filter modules based on completion status
      const filteredModules = modules.filter(module => {
        const moduleProgress = progressByModule[module.id] || [];
        const completedMaterials = moduleProgress.filter(p => p.status === 'COMPLETED').length;
        const isModuleCompleted = module._count.materials > 0 && completedMaterials === module._count.materials;
        
        return completed ? isModuleCompleted : !isModuleCompleted;
      });
      
      return NextResponse.json(filteredModules);
    }
    
    return NextResponse.json(modules);
  } catch (error) {
    console.error('Error fetching training modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
