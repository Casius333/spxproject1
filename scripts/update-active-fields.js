const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false
};

// Connect to the database
const pool = new Pool(poolConfig);

async function updateActiveFields() {
  const client = await pool.connect();
  
  try {
    console.log('Starting migration to update active fields...');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // 1. Add active field to users table if it doesn't exist
    console.log('Adding active field to users table...');
    await client.query(`
      ALTER TABLE IF EXISTS users 
      ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notes TEXT
    `);
    
    // 2. Update games table - rename is_active to active
    console.log('Updating games table - renaming is_active to active...');
    try {
      // Check if is_active exists
      const { rows: columns } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'games' AND column_name = 'is_active'
      `);
      
      if (columns.length > 0) {
        console.log('Found is_active column in games table, renaming to active...');
        await client.query(`
          ALTER TABLE games 
          RENAME COLUMN is_active TO active
        `);
      } else {
        console.log('is_active column not found in games table, checking if active exists...');
        
        // Check if active column already exists
        const { rows: activeColumns } = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'games' AND column_name = 'active'
        `);
        
        if (activeColumns.length === 0) {
          console.log('active column not found, adding it...');
          await client.query(`
            ALTER TABLE games 
            ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE
          `);
        } else {
          console.log('active column already exists in games table');
        }
      }
    } catch (error) {
      console.error('Error updating games table:', error);
      throw error;
    }
    
    // 3. Update admin_users table - rename is_active to active
    console.log('Updating admin_users table - renaming is_active to active...');
    try {
      // Check if is_active exists
      const { rows: columns } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'admin_users' AND column_name = 'is_active'
      `);
      
      if (columns.length > 0) {
        console.log('Found is_active column in admin_users table, renaming to active...');
        await client.query(`
          ALTER TABLE admin_users 
          RENAME COLUMN is_active TO active
        `);
      } else {
        console.log('is_active column not found in admin_users table, checking if active exists...');
        
        // Check if active column already exists
        const { rows: activeColumns } = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'admin_users' AND column_name = 'active'
        `);
        
        if (activeColumns.length === 0) {
          console.log('active column not found, adding it...');
          await client.query(`
            ALTER TABLE admin_users 
            ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE
          `);
        } else {
          console.log('active column already exists in admin_users table');
        }
      }
    } catch (error) {
      console.error('Error updating admin_users table:', error);
      throw error;
    }
    
    // 4. Update promotions table - rename is_active to active
    console.log('Updating promotions table - renaming is_active to active...');
    try {
      // Check if is_active exists
      const { rows: columns } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'promotions' AND column_name = 'is_active'
      `);
      
      if (columns.length > 0) {
        console.log('Found is_active column in promotions table, renaming to active...');
        await client.query(`
          ALTER TABLE promotions 
          RENAME COLUMN is_active TO active
        `);
      } else {
        console.log('is_active column not found in promotions table, checking if active exists...');
        
        // Check if active column already exists
        const { rows: activeColumns } = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'promotions' AND column_name = 'active'
        `);
        
        if (activeColumns.length === 0) {
          console.log('active column not found, adding it...');
          await client.query(`
            ALTER TABLE promotions 
            ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE
          `);
        } else {
          console.log('active column already exists in promotions table');
        }
      }
    } catch (error) {
      console.error('Error updating promotions table:', error);
      throw error;
    }
    
    // 5. Update affiliates table - rename is_active to active
    console.log('Updating affiliates table - renaming is_active to active...');
    try {
      // Check if is_active exists
      const { rows: columns } = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'is_active'
      `);
      
      if (columns.length > 0) {
        console.log('Found is_active column in affiliates table, renaming to active...');
        await client.query(`
          ALTER TABLE affiliates 
          RENAME COLUMN is_active TO active
        `);
      } else {
        console.log('is_active column not found in affiliates table, checking if active exists...');
        
        // Check if active column already exists
        const { rows: activeColumns } = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'affiliates' AND column_name = 'active'
        `);
        
        if (activeColumns.length === 0) {
          console.log('active column not found, adding it...');
          await client.query(`
            ALTER TABLE affiliates 
            ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE
          `);
        } else {
          console.log('active column already exists in affiliates table');
        }
      }
    } catch (error) {
      console.error('Error updating affiliates table:', error);
      throw error;
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
updateActiveFields().catch(console.error);