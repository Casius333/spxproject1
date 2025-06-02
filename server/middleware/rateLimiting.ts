import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    message: 'Too many requests from this IP, please try again later',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for admin routes in development
    return process.env.NODE_ENV === 'development' && req.path.startsWith('/api/admin');
  }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    message: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

// Admin-specific rate limiting
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin operations
  message: {
    message: 'Too many admin requests, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Very strict rate limiting for sensitive operations
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Only 3 attempts per hour for sensitive operations
  message: {
    message: 'Too many attempts for sensitive operation, please try again later',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false
});