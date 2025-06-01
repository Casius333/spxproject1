import { z } from 'zod';

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  ADMIN_JWT_SECRET: z.string().min(32, 'ADMIN_JWT_SECRET must be at least 32 characters').optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

export const env = validateEnv();

// Application configuration
export const config = {
  // Server settings
  SERVER: {
    PORT: env.PORT,
    IS_PRODUCTION: env.NODE_ENV === 'production',
    IS_DEVELOPMENT: env.NODE_ENV === 'development',
  },

  // Database settings
  DATABASE: {
    URL: env.DATABASE_URL,
    POOL: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
    },
  },

  // Security settings
  SECURITY: {
    JWT_SECRET: env.JWT_SECRET,
    ADMIN_JWT_SECRET: env.ADMIN_JWT_SECRET,
    JWT_EXPIRES_IN: '24h',
    ADMIN_JWT_EXPIRES_IN: '8h',
    BCRYPT_ROUNDS: 12,
  },

  // Session configuration
  SESSION: {
    SECRET: env.SESSION_SECRET,
    NAME: 'luckypunt.session',
    COOKIE: {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    RESAVE: false,
    SAVE_UNINITIALIZED: false,
  },

  // CORS settings
  CORS: {
    ORIGIN: env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
    CREDENTIALS: true,
    METHODS: ['GET', 'POST', 'PATCH', 'DELETE'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
  },

  // Rate limiting
  RATE_LIMIT: {
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      message: 'Too many authentication attempts, please try again later',
    },
    GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: 'Too many requests, please try again later',
    },
    WITHDRAWAL: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 withdrawal requests per hour
      message: 'Too many withdrawal requests, please try again later',
    },
  },

  // Business logic settings
  BUSINESS: {
    TIMEZONE: 'Australia/Sydney',
    MIN_PASSWORD_LENGTH: 8,
    MAX_BET_AMOUNT: 10000,
    MIN_BET_AMOUNT: 0.01,
    MAX_WITHDRAWAL_AMOUNT: 50000,
    MIN_WITHDRAWAL_AMOUNT: 10,
  },
};

export default config;