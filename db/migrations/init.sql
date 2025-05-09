-- Create tables

-- Users table (separate from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  provider VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  is_featured BOOLEAN DEFAULT FALSE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_jackpot BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  category VARCHAR(50), -- String representation for filtering
  jackpot_amount DECIMAL(12, 2),
  rtp DECIMAL(5, 2),
  volatility VARCHAR(50),
  min_bet DECIMAL(10, 2) DEFAULT 0.5,
  max_bet DECIMAL(10, 2) DEFAULT 100,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- User balance table
CREATE TABLE IF NOT EXISTS user_balance (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 1000,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Transaction history table
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- bet, win, deposit
  amount DECIMAL(12, 2) NOT NULL,
  game_id INTEGER REFERENCES games(id),
  balance_before DECIMAL(12, 2) NOT NULL,
  balance_after DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add session table for Express session
CREATE TABLE IF NOT EXISTS session (
  sid VARCHAR(255) NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

-- Insert default categories
INSERT INTO categories (name, slug)
VALUES 
  ('All Slots', 'all-slots'),
  ('Classic Slots', 'classic-slots'),
  ('Video Slots', 'video-slots'),
  ('Jackpot Slots', 'jackpot-slots'),
  ('Megaways Slots', 'megaways-slots')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample games
INSERT INTO games (
  title,
  slug,
  description,
  provider,
  image,
  category_id,
  is_featured,
  is_popular,
  is_new,
  is_jackpot,
  category,
  rtp,
  volatility,
  min_bet,
  max_bet
)
VALUES
  (
    'Big Bass Bonanza',
    'big-bass-bonanza',
    'Catch the big one in this fishing-themed slot with free spins and money symbols.',
    'Pragmatic Play',
    'https://cdn.plaingaming.net/files/online-slots/big-bass-bonanza-thumbnail.webp', 
    3, -- Video Slots
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    'video-slots',
    96.71,
    'High',
    0.10,
    250.00
  ),
  (
    'Starburst',
    'starburst',
    'A classic cosmic slot with expanding wilds and respins.',
    'NetEnt',
    'https://cdn.plaingaming.net/files/online-slots/starburst-thumbnail.webp',
    2, -- Classic Slots
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    'classic-slots',
    96.09,
    'Low',
    0.10,
    100.00
  ),
  (
    'Mega Moolah',
    'mega-moolah',
    'The millionaire maker with four progressive jackpots.',
    'Microgaming',
    'https://cdn.plaingaming.net/files/online-slots/mega-moolah-thumbnail.webp',
    4, -- Jackpot Slots
    TRUE,
    TRUE,
    FALSE,
    TRUE,
    'jackpot-slots',
    88.12,
    'Medium',
    0.25,
    6.25
  ),
  (
    'Gonzo\'s Quest Megaways',
    'gonzos-quest-megaways',
    'Join Gonzo in his quest for El Dorado with up to 117,649 ways to win.',
    'Red Tiger',
    'https://cdn.plaingaming.net/files/online-slots/gonzos-quest-megaways-thumbnail.webp',
    5, -- Megaways Slots
    TRUE,
    TRUE,
    TRUE,
    FALSE,
    'megaways-slots',
    96.00,
    'High',
    0.10,
    4.00
  ),
  (
    'Sweet Bonanza',
    'sweet-bonanza',
    'A sweet treat with tumbling reels and multipliers.',
    'Pragmatic Play',
    'https://cdn.plaingaming.net/files/online-slots/sweet-bonanza-thumbnail.webp',
    3, -- Video Slots
    TRUE,
    TRUE,
    FALSE,
    FALSE,
    'video-slots',
    96.51,
    'High',
    0.20,
    125.00
  )
ON CONFLICT (slug) DO NOTHING;