import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

// Get connection parameters from environment variables
const config = {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: true
};

async function addPhoneNumberColumn() {
  const pool = new Pool(config);
  
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Checking if phone_number column exists...');
      const columnCheckResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'phone_number'
      `);
      
      if (columnCheckResult.rows.length === 0) {
        console.log('Adding phone_number column to users table...');
        await client.query(`
          ALTER TABLE users
          ADD COLUMN IF NOT EXISTS phone_number TEXT
        `);
        console.log('Column added successfully!');
      } else {
        console.log('Column phone_number already exists.');
      }
      
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error adding phone_number column:', err);
  } finally {
    await pool.end();
  }
}

addPhoneNumberColumn().catch(console.error);