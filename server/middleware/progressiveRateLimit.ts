import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Extend session to include login strikes
declare module 'express-session' {
  interface SessionData {
    loginStrikes?: number;
    lastLoginAttempt?: Date;
  }
}

export const progressiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req: Request) => {
    const strikes = req.session.loginStrikes || 0;
    return Math.max(5 - strikes, 1); // Start with 5 attempts, decrease with each strike
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    req.session.loginStrikes = (req.session.loginStrikes || 0) + 1;
    req.session.lastLoginAttempt = new Date();
    
    const remainingTime = Math.ceil(15 - (Date.now() - req.session.lastLoginAttempt.getTime()) / (60 * 1000));
    
    res.status(429).json({
      error: {
        message: 'Too many login attempts, try again later',
        code: 'RATE_LIMIT_EXCEEDED',
        nextAttemptIn: `${remainingTime} minutes`,
        strikes: req.session.loginStrikes
      }
    });
  },
  // Reset strikes on successful login (handled in auth routes)
  skip: (req: Request) => {
    // Skip rate limiting for already authenticated users
    return req.isAuthenticated && req.isAuthenticated();
  }
});

// Withdrawal rate limiting for high-risk operations
export const withdrawalRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Maximum 3 withdrawal attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: {
        message: 'Too many withdrawal attempts, please try again later',
        code: 'WITHDRAWAL_RATE_LIMIT_EXCEEDED',
        nextAttemptIn: '1 hour'
      }
    });
  }
});

// Reset login strikes on successful authentication
export const resetLoginStrikes = (req: Request) => {
  if (req.session.loginStrikes) {
    delete req.session.loginStrikes;
    delete req.session.lastLoginAttempt;
  }
};