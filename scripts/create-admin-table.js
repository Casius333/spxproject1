// Import the pg module directly
import pg from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new pool with the connection info
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminTable() {
  try {
    console.log('Creating admin_users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP,
        last_login TIMESTAMP
      );
    `);
    console.log('admin_users table created successfully');
    
    // Check if admin user exists, create if not
    const checkAdmin = await pool.query('SELECT COUNT(*) FROM admin_users WHERE username = $1', ['admin']);
    
    if (parseInt(checkAdmin.rows[0].count) === 0) {
      // Simple hash function for demo - in production use a proper password hashing library
      const hashedPassword = crypto.createHash('sha256').update('admin123').digest('hex');
      
      await pool.query(
        'INSERT INTO admin_users (username, email, password, role, is_active) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@luckypunt.com', hashedPassword, 'admin', true]
      );
      
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    console.log('Script completed successfully');
  } catch (error) {
    console.error('Error creating admin table:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

createAdminTable();