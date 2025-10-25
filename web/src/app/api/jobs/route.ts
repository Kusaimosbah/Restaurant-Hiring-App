import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { JobService } from '@/lib/services/JobService';
import { 
  withErrorHandling, 
  validateRequiredFields, 
  handleServiceResult,
  parsePaginationParams,
  parseFilterParams
} from '@/lib/middleware/apiResponse';
import { JobStatus, WorkType } from '@prisma/client';

/**
 * GET /api/jobs
 * Get all jobs (with filtering and pagination)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Parse pagination and filter parameters
  const { page, limit } = parsePaginationParams(request);
  const filters = parseFilterParams(request, [
    'status', 'workType', 'employerId', 'department', 'location', 'salary_min', 'salary_max'
  ]);

  // Get jobs using the service layer
  const jobService = new JobService();
  const result = await jobService.getJobs(filters, page, limit);

  if (result.success) {
    return handleServiceResult(result, {
      page,
      limit,
      total: result.data!.total,
      pages: result.data!.pages
    });
  }

  return handleServiceResult(result);
});

/**
 * POST /api/jobs
 * Create a new job (for employers)
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return handleServiceResult({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  // Only restaurant owners can create jobs
  if (session.user.role !== 'RESTAURANT_OWNER') {
    return handleServiceResult({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Only restaurant owners can create jobs' }
    });
  }

  const body = await request.json();
  
  // Validate required fields
  const validationError = validateRequiredFields(body, [
    'title', 'description', 'salary_min', 'salary_max', 'location', 'workType', 'department'
  ]);
  
  if (validationError) {
    return handleServiceResult({
      success: false,
      error: validationError
    });
  }

  // Create job using the service layer
  const jobService = new JobService();
  const result = await jobService.createJob({
    ...body,
    employerId: session.user.id,
    requirements: body.requirements || '',
    experience_level: body.experience_level || 'Entry Level',
    skills_required: body.skills_required || [],
    benefits: body.benefits || []
  });

  return handleServiceResult(result);
        endDate: new Date(validatedData.endDate),
        restaurantId: restaurant.id
      }
    });

    // Find workers who might be interested in this job
    // In a real app, this would use more sophisticated matching
    const potentialWorkers = await prisma.workerProfile.findMany({
      take: 10, // Limit to 10 workers for demo purposes
      include: {
        user: true
      }
    });

    // Notify workers about the new job
    for (const worker of potentialWorkers) {
      await notifyNewJob(
        worker.userId,
        job.id,
        job.title,
        restaurant.name
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}