import crypto from 'crypto';

// Environment variable validation and configuration
interface Config {
  // Database
  DATABASE_URL: string;
  
  // JWT Secrets
  JWT_SECRET: string;
  ADMIN_JWT_SECRET: string;
  
  // Server
  PORT: number;
  NODE_ENV: string;
  
  // Session
  SESSION_SECRET: string;
  
  // Optional external services
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  VITE_STRIPE_PUBLIC_KEY?: string;
}

function validateEnvironment(): Config {
  const requiredEnvVars = [
    'DATABASE_URL'
  ];

  // Check for required environment variables
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    process.exit(1);
  }

  // Generate secure fallbacks for secrets if not provided
  const jwtSecret = process.env.JWT_SECRET || (() => {
    const secret = crypto.randomBytes(64).toString('hex');
    console.warn('JWT_SECRET not set, generated secure random key for this session');
    return secret;
  })();

  const adminJwtSecret = process.env.ADMIN_JWT_SECRET || (() => {
    const secret = crypto.randomBytes(64).toString('hex');
    console.warn('ADMIN_JWT_SECRET not set, generated secure random key for this session');
    return secret;
  })();

  const sessionSecret = process.env.SESSION_SECRET || (() => {
    const secret = crypto.randomBytes(64).toString('hex');
    console.warn('SESSION_SECRET not set, generated secure random key for this session');
    return secret;
  })();

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: jwtSecret,
    ADMIN_JWT_SECRET: adminJwtSecret,
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    SESSION_SECRET: sessionSecret,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    VITE_STRIPE_PUBLIC_KEY: process.env.VITE_STRIPE_PUBLIC_KEY
  };
}

export const config = validateEnvironment();

// Validate specific configurations
export function validateConfig() {
  // Validate JWT secret strength (should be at least 32 characters)
  if (config.JWT_SECRET.length < 32) {
    console.warn('JWT_SECRET should be at least 32 characters long for security');
  }
  
  if (config.ADMIN_JWT_SECRET.length < 32) {
    console.warn('ADMIN_JWT_SECRET should be at least 32 characters long for security');
  }

  // Validate NODE_ENV
  const validEnvironments = ['development', 'production', 'test'];
  if (!validEnvironments.includes(config.NODE_ENV)) {
    console.warn(`NODE_ENV "${config.NODE_ENV}" is not a standard environment. Consider using: ${validEnvironments.join(', ')}`);
  }

  // Production-specific validations
  if (config.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET must be explicitly set in production environment');
      process.exit(1);
    }
    
    if (!process.env.ADMIN_JWT_SECRET) {
      console.error('ADMIN_JWT_SECRET must be explicitly set in production environment');
      process.exit(1);
    }
    
    if (!process.env.SESSION_SECRET) {
      console.error('SESSION_SECRET must be explicitly set in production environment');
      process.exit(1);
    }
  }

  console.log('Environment configuration validated successfully');
  return true;
}