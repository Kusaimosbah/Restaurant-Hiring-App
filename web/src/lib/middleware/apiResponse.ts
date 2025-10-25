import { NextRequest, NextResponse } from 'next/server';
import { ServiceResult, BusinessError } from '@/lib/domain/types';
import { AppError } from '@/lib/errors/AppError';

/**
 * API Response Utilities
 * Standardized response handling for API routes
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    field?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta })
  });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 400,
  errorCode: string = 'BAD_REQUEST',
  field?: string,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(field && { field }),
        ...(details && { details })
      }
    },
    { status: statusCode }
  );
}

/**
 * Handle service result and return appropriate response
 */
export function handleServiceResult<T>(
  result: ServiceResult<T>,
  meta?: ApiResponse<T>['meta']
): NextResponse<ApiResponse<T>> {
  if (result.success) {
    return createSuccessResponse(result.data!, meta);
  }

  const error = result.error!;
  let statusCode = 400;

  // Map error codes to HTTP status codes
  switch (error.code) {
    case 'USER_NOT_FOUND':
    case 'JOB_NOT_FOUND':
      statusCode = 404;
      break;
    case 'UNAUTHORIZED':
      statusCode = 401;
      break;
    case 'FORBIDDEN':
      statusCode = 403;
      break;
    case 'USER_EXISTS':
      statusCode = 409;
      break;
    case 'VALIDATION_ERROR':
    case 'INVALID_EMAIL':
    case 'WEAK_PASSWORD':
    case 'INVALID_TITLE':
    case 'INVALID_DESCRIPTION':
    case 'INVALID_SALARY_RANGE':
    case 'INVALID_WORK_TYPE':
    case 'INVALID_LOCATION':
      statusCode = 400;
      break;
    default:
      statusCode = 500;
  }

  return createErrorResponse(
    error.message,
    statusCode,
    error.code,
    error.field,
    error.details
  );
}

/**
 * Global error handler for API routes
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return createErrorResponse(
      error.message,
      error.statusCode,
      error.code,
      undefined,
      error.details
    );
  }

  if (error instanceof Error) {
    // Handle Prisma errors
    if ('code' in error) {
      switch (error.code) {
        case 'P2002':
          return createErrorResponse(
            'A record with this information already exists',
            409,
            'DUPLICATE_ENTRY'
          );
        case 'P2025':
          return createErrorResponse(
            'Record not found',
            404,
            'NOT_FOUND'
          );
        default:
          return createErrorResponse(
            'Database error occurred',
            500,
            'DATABASE_ERROR',
            undefined,
            { code: error.code }
          );
      }
    }

    return createErrorResponse(
      'Internal server error',
      500,
      'INTERNAL_ERROR',
      undefined,
      { message: error.message }
    );
  }

  return createErrorResponse(
    'An unexpected error occurred',
    500,
    'UNKNOWN_ERROR'
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: any,
  requiredFields: string[]
): BusinessError | null {
  const missingFields = requiredFields.filter(field => !body[field]);
  
  if (missingFields.length > 0) {
    return {
      code: 'MISSING_REQUIRED_FIELDS',
      message: `Missing required fields: ${missingFields.join(', ')}`,
      field: missingFields[0]
    };
  }

  return null;
}

/**
 * Parse pagination parameters from request
 */
export function parsePaginationParams(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  
  return { page, limit };
}

/**
 * Parse filter parameters from request
 */
export function parseFilterParams(request: NextRequest, allowedFilters: string[]) {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, any> = {};

  allowedFilters.forEach(filter => {
    const value = searchParams.get(filter);
    if (value !== null && value !== '') {
      // Handle numeric filters
      if (['salary_min', 'salary_max'].includes(filter)) {
        const numValue = parseInt(value, 10);
        if (!isNaN(numValue)) {
          filters[filter] = numValue;
        }
      } else {
        filters[filter] = value;
      }
    }
  });

  return filters;
}

/**
 * Async wrapper for API route handlers
 * Provides consistent error handling across all routes
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}