import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import csrf from 'csurf';
import cors from 'cors';
import { config } from '../config';
import { Request, Response, NextFunction } from 'express';

// CORS configuration
export const corsMiddleware = cors({
  origin: config.CORS.ORIGIN,
  credentials: config.CORS.CREDENTIALS,
  methods: config.CORS.METHODS,
  allowedHeaders: config.CORS.ALLOWED_HEADERS,
});

// Helmet security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for Socket.IO compatibility
});

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.AUTH.windowMs,
  max: config.RATE_LIMIT.AUTH.max,
  message: {
    error: {
      message: config.RATE_LIMIT.AUTH.message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting in development for easier testing
    return config.SERVER.IS_DEVELOPMENT && req.ip === '127.0.0.1';
  },
});

export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.GENERAL.windowMs,
  max: config.RATE_LIMIT.GENERAL.max,
  message: {
    error: {
      message: config.RATE_LIMIT.GENERAL.message,
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    return config.SERVER.IS_DEVELOPMENT && req.ip === '127.0.0.1';
  },
});

export const withdrawalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.WITHDRAWAL.windowMs,
  max: config.RATE_LIMIT.WITHDRAWAL.max,
  message: {
    error: {
      message: config.RATE_LIMIT.WITHDRAWAL.message,
      code: 'WITHDRAWAL_RATE_LIMIT_EXCEEDED',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF protection
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: config.SERVER.IS_PRODUCTION,
    sameSite: 'strict',
  },
  // Skip CSRF for API routes that use JWT authentication
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
});

// CSRF token endpoint
export const csrfTokenHandler = (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for sensitive endpoints
  if (req.path.includes('/api/admin') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// IP logging middleware for audit trails
export const ipLogger = (req: Request, res: Response, next: NextFunction) => {
  // Get real IP address (considering proxies)
  const realIP = req.headers['x-forwarded-for'] || 
                req.headers['x-real-ip'] || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress || 
                req.ip;
  
  // Attach IP to request for use in other middleware
  req.userIP = Array.isArray(realIP) ? realIP[0] : realIP;
  
  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      userIP?: string;
    }
  }
}