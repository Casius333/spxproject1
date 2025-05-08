import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import config from "../config";

// This is the correct way neon config - DO NOT change this
neonConfig.webSocketConstructor = ws;

// Temporarily use the local database until we resolve Supabase connection issues
// We'll keep the config structure for future deployment
let connectionString = config.DATABASE_URL;

// Fallback to local database if there's an issue with the connection string
try {
  // Test if the URL is valid by creating a URL object
  new URL(connectionString);
  console.log("Using external database configuration");
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