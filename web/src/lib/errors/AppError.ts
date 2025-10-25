/**
 * Custom Application Errors for Better Error Handling
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, { field, ...details });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Error Response Format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

/**
 * Error Handler Utility
 */
export class ErrorHandler {
  
  /**
   * Format error for API response
   */
  static formatError(error: Error, path?: string): ErrorResponse {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
          timestamp: new Date().toISOString(),
          path
        }
      };
    }

    // Generic error fallback
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path
      }
    };
  }

  /**
   * Log error (integrate with logging service)
   */
  static logError(error: Error, context?: any): void {
    const logData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    };

    if (error instanceof AppError && !error.isOperational) {
      console.error('🚨 Programming Error:', logData);
    } else {
      console.error('⚠️ Operational Error:', logData);
    }
  }
}