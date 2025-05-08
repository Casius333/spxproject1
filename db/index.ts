import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
import config from "../config";

// Get the database connection string from environment variables
let connectionString = config.DATABASE_URL;

// Validate the connection string
try {
  // Test if the URL is valid by creating a URL object
  new URL(connectionString);
  console.log("Using Supabase database configuration");
  
  // Check if it's a Supabase connection
  if (connectionString.includes('supabase')) {
    console.log("Detected Supabase Transaction Pooler connection");
  }
} catch (error) {
  console.log("Using local database configuration - will automatically create if needed");
  // Use process.env.DATABASE_URL as a fallback which was provisioned by Replit
  connectionString = process.env.DATABASE_URL || "";
}

// Check if DATABASE_URL is set
if (!connectionString) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database connection pool
export const pool = new Pool({ connectionString });
export const db = drizzle({ client: pool, schema });