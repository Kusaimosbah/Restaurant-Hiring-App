import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ApplicationService } from '@/lib/services/ApplicationService'
import { 
  withErrorHandling, 
  validateRequiredFields, 
  handleServiceResult,
  parsePaginationParams,
  parseFilterParams
} from '@/lib/middleware/apiResponse'

/**
 * GET /api/applications
 * Get applications with filtering and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return handleServiceResult({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    });
  }

  // Parse pagination and filter parameters
  const { page, limit } = parsePaginationParams(request);
  const filters = parseFilterParams(request, ['status', 'jobId', 'applicantId', 'employerId']);

  // Add user-specific filters based on role
  if (session.user.role === 'WORKER') {
    filters.applicantId = session.user.id;
  } else if (session.user.role === 'RESTAURANT_OWNER') {
    filters.employerId = session.user.id;
  }

  // Get applications using the service layer
  const applicationService = new ApplicationService();
  const result = await applicationService.getApplications(filters, page, limit);

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
 * POST /api/applications
 * Submit a job application
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'WORKER') {
    return handleServiceResult({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Only workers can submit applications' }
    });
  }

  const body = await request.json();
  
  // Validate required fields
  const validationError = validateRequiredFields(body, ['jobId']);
  
  if (validationError) {
    return handleServiceResult({
      success: false,
      error: validationError
    });
  }

  // Submit application using the service layer
  const applicationService = new ApplicationService();
  const result = await applicationService.submitApplication({
    jobId: body.jobId,
    applicantId: session.user.id,
    coverLetter: body.coverLetter,
    resumeUrl: body.resumeUrl,
    expectedSalary: body.expectedSalary
  });

  return handleServiceResult(result);
});