import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function createUserPromotionsTable() {
  try {
    // Create the user_promotions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_promotions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        promotion_id INTEGER NOT NULL REFERENCES promotions(id),
        deposit_id INTEGER NOT NULL REFERENCES deposits(id),
        bonus_amount DECIMAL(12,2) NOT NULL,
        turnover_requirement DECIMAL(12,2) NOT NULL,
        wagering_progress DECIMAL(12,2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'active',
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log('user_promotions table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating user_promotions table:', error);
    process.exit(1);
  }
}

createUserPromotionsTable().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});