import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

// Custom error class for application errors
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Production-safe error response
const createErrorResponse = (error: any, req: Request): ApiError => {
  // Default error response
  let response: ApiError = {
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };

  // Handle known operational errors
  if (error.isOperational) {
    response = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };

    // Include details only in development
    if (config.SERVER.IS_DEVELOPMENT && error.details) {
      response.details = error.details;
    }
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.array) {
    response = {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
    };

    if (config.SERVER.IS_DEVELOPMENT) {
      response.details = error.array ? error.array() : error.details;
    }
  }

  // Handle database errors
  if (error.code && typeof error.code === 'string') {
    switch (error.code) {
      case '23505': // Unique violation
        response = {
          message: 'Resource already exists',
          code: 'DUPLICATE_RESOURCE',
          statusCode: 409,
        };
        break;
      case '23503': // Foreign key violation
        response = {
          message: 'Referenced resource not found',
          code: 'INVALID_REFERENCE',
          statusCode: 400,
        };
        break;
      case '23502': // Not null violation
        response = {
          message: 'Required field missing',
          code: 'MISSING_REQUIRED_FIELD',
          statusCode: 400,
        };
        break;
      case '42703': // Undefined column
        response = {
          message: 'Database schema error',
          code: 'SCHEMA_ERROR',
          statusCode: 500,
        };
        break;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    response = {
      message: 'Invalid authentication token',
      code: 'INVALID_TOKEN',
      statusCode: 401,
    };
  }

  if (error.name === 'TokenExpiredError') {
    response = {
      message: 'Authentication token expired',
      code: 'TOKEN_EXPIRED',
      statusCode: 401,
    };
  }

  // Handle rate limiting errors
  if (error.statusCode === 429) {
    response = {
      message: error.message || 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    };
  }

  // Handle bcrypt errors
  if (error.name === 'Error' && error.message.includes('bcrypt')) {
    response = {
      message: 'Authentication failed',
      code: 'AUTH_ERROR',
      statusCode: 401,
    };
  }

  return response;
};

// Main error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error with context
  const errorContext = {
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.userIP || req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
    stack: error.stack,
    message: error.message,
    code: error.code,
  };

  // Log based on severity
  if (error.isOperational) {
    logger.warn('Operational error occurred', errorContext);
  } else {
    logger.error('Unexpected error occurred', errorContext);
  }

  // Create response
  const errorResponse = createErrorResponse(error, req);

  // Send response
  res.status(errorResponse.statusCode).json({
    error: errorResponse,
    ...(config.SERVER.IS_DEVELOPMENT && {
      debug: {
        stack: error.stack,
        originalError: error.message,
      },
    }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  
  res.status(404).json({
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    },
  });
};

// Process error handlers
export const handleUncaughtException = (error: Error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
};

export const handleUnhandledRejection = (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise.toString(),
    timestamp: new Date().toISOString(),
  });
  
  // Give time for logs to be written
  setTimeout(() => {
    process.exit(1);
  }, 1000);
};