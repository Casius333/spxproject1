import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database configuration from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required in environment variables');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : false
});

async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    console.log('Executing SQL initialization script...');
    await pool.query(sql);
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase();