// This script tests connection to Supabase and creates a test user
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { Pool } from 'pg';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const databaseUrl = process.env.DATABASE_URL;

console.log('=== Supabase Connection Test ===');
console.log('Supabase URL:', supabaseUrl);

// Test 1: Test Supabase Auth API
async function testSupabaseAuth() {
  console.log('\n--- Testing Supabase Auth API ---');
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test sign-up
    const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
    const testPassword = 'Password123!';
    
    console.log(`Creating test user: ${testEmail}`);
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: testEmail.split('@')[0],
        }
      }
    });
    
    if (error) {
      console.error('Error creating test user:', error.message);
      console.error('Full error:', error);
      return false;
    }
    
    console.log('SUCCESS: User created through Supabase Auth API');
    console.log('User data:', JSON.stringify(data.user, null, 2));
    return true;
  } catch (error) {
    console.error('Exception testing Supabase Auth:', error);
    return false;
  }
}

// Test 2: Test Supabase Database Connection
async function testSupabaseDatabase() {
  console.log('\n--- Testing Supabase Database Connection ---');
  try {
    console.log('DATABASE_URL:', databaseUrl);
    
    // Configure SSL for Supabase - REQUIRED
    const sslConfig = {
      rejectUnauthorized: false,
      ca: null,
      servername: databaseUrl.match(/\/\/([^:]+):/)?.[1] || 'db.lhqydgcveburtggdsgts.supabase.co'
    };
    
    // Create a Postgres connection pool with SSL settings
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: sslConfig
    });
    
    console.log('Trying to connect to database...');
    const client = await pool.connect();
    
    console.log('SUCCESS: Connected to database');
    
    // Check if users table exists
    console.log('Testing query on users table...');
    try {
      const result = await client.query('SELECT COUNT(*) FROM users');
      console.log(`SUCCESS: Found ${result.rows[0].count} users in the database`);
    } catch (tableError) {
      console.log('Could not query users table, it might not exist yet:', tableError.message);
      
      // Try to create users table as a test
      console.log('Attempting to create a test_users table as a test...');
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS test_users (
            id SERIAL PRIMARY KEY,
            email TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `);
        console.log('SUCCESS: Created test_users table');
        
        // Insert a test record
        const email = `test${Math.floor(Math.random() * 10000)}@example.com`;
        await client.query(
          'INSERT INTO test_users (email) VALUES ($1) RETURNING *',
          [email]
        );
        console.log(`SUCCESS: Inserted test user with email ${email}`);
        
        // Query back to verify
        const testResult = await client.query('SELECT * FROM test_users');
        console.log(`Found ${testResult.rowCount} rows in test_users table`);
      } catch (createError) {
        console.error('Error creating test table:', createError.message);
      }
    }
    
    client.release();
    await pool.end();
    return true;
  } catch (error) {
    console.error('Error connecting to Supabase database:', error);
    if (error.code === 'ENOTFOUND') {
      console.error('DNS resolution failed. This might be due to network restrictions in your environment.');
    }
    return false;
  }
}

// Run the tests
async function runTests() {
  const authSuccess = await testSupabaseAuth();
  const dbSuccess = await testSupabaseDatabase();
  
  console.log('\n=== Summary ===');
  console.log('Supabase Auth API Test:', authSuccess ? 'SUCCESS' : 'FAILED');
  console.log('Supabase Database Test:', dbSuccess ? 'SUCCESS' : 'FAILED');
  
  if (!authSuccess && !dbSuccess) {
    console.log('\nTROUBLESHOOTING:');
    console.log('1. Verify your Supabase URL and ANON_KEY are correct');
    console.log('2. Check if DATABASE_URL is properly formatted');
    console.log('3. Ensure your Replit environment can make outbound connections');
    console.log('4. Verify that your Supabase project is active and not paused');
  }
}

runTests();