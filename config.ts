/**
 * Application Configuration
 * 
 * This module centralizes all environment variable access and configuration settings.
 * It validates required variables and provides type-safe access to configuration.
 */

// Environment variables with defaults for development
const config = {
  // Server configuration
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Application settings
  API_PREFIX: '/api',
  ENABLE_LOGGING: process.env.ENABLE_LOGGING === 'true',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Initial user balance (for development without auth)
  INITIAL_BALANCE: 1000,
};

// Validate required configuration
function validateConfig() {
  const requiredVars = ['DATABASE_URL'];
  
  for (const envVar of requiredVars) {
    if (!config[envVar as keyof typeof config]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

// Only validate in production to allow for local development
if (process.env.NODE_ENV === 'production') {
  validateConfig();
}

export default config;