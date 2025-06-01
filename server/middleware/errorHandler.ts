import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Centralized error handling middleware
export function errorHandler(
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error for internal monitoring
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }

  // Handle operational errors (known errors we can safely expose)
  if ((error as AppError).isOperational) {
    return res.status((error as AppError).statusCode || 500).json({
      message: error.message
    });
  }

  // Handle specific known error types
  if (error.message.includes('duplicate key value violates unique constraint')) {
    return res.status(409).json({
      message: 'Resource already exists'
    });
  }

  if (error.message.includes('invalid input syntax')) {
    return res.status(400).json({
      message: 'Invalid data format'
    });
  }

  if (error.message.includes('permission denied')) {
    return res.status(403).json({
      message: 'Access denied'
    });
  }

  // Default to 500 server error for unknown errors
  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    message: 'Internal server error',
    ...(isDevelopment && {
      error: error.message,
      stack: error.stack
    })
  });
}

// Custom error class for operational errors
export class OperationalError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Async error wrapper to catch async errors automatically
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler middleware
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new OperationalError(`Route ${req.method} ${req.originalUrl} not found`, 404);
  next(error);
}