import { supabase } from '../lib/supabase';
import { User, users, usersInsertSchema } from '@shared/schema';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { eq } from 'drizzle-orm';

// User type that matches the Supabase auth user
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
  };
}

// Create a user in our database using direct SQL queries to bypass ORM issues
async function createDatabaseUser(supabaseUser: any, username: string) {
  try {
    if (!supabaseUser || !supabaseUser.email) {
      console.error("Cannot create database user without email");
      return null;
    }
    
    // Create a temporary random password for the database record
    // (real authentication happens via Supabase JWT)
    const tempPassword = Math.random().toString(36).slice(-10);
    
    // Use direct SQL approach exclusively to avoid schema mismatches
    const { pool } = require('../db');
    
    // First check if user already exists
    const existingResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [supabaseUser.email]
    );
    
    if (existingResult.rows && existingResult.rows.length > 0) {
      console.log(`User with email ${supabaseUser.email} already exists in database`);
      return existingResult.rows[0];
    }
    
    // Create user if doesn't exist
    const result = await pool.query(
      'INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [username, supabaseUser.email, tempPassword, new Date(), new Date()]
    );
    
    if (result.rows && result.rows[0]) {
      console.log(`Created database user for ${supabaseUser.email} using direct SQL`);
      return result.rows[0];
    } else {
      console.error("No rows returned from user creation query");
      return null;
    }
  } catch (error) {
    console.error("Error creating database user:", error);
    // We'll continue even if there's an error creating the database user
    // because the authentication is primarily handled by Supabase
    return null;
  }
}

// Register a new user
export async function registerUser(email: string, password: string) {
  // Generate username from email (username@example.com -> username1234)
  const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
  
  // Register with Supabase Auth with email auto-confirmation
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
      // This will bypass email verification requirement
      emailRedirectTo: `${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:5000'}/auth/callback`
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  // For development - skip email verification by confirming the user immediately
  // NOTE: In production, you would remove this and use proper email verification
  try {
    // This line requires admin privileges - will work if your anon key has enough permissions
    // If this fails, user will still be registered but will need to verify email
    await supabase.auth.admin.updateUserById(data.user?.id || '', {
      email_confirm: true
    });
  } catch (confirmError) {
    console.log("Could not auto-confirm user email - user will need to verify via email link");
  }
  
  // Create/sync user in our database
  let dbUser = null;
  try {
    dbUser = await createDatabaseUser(data.user, username);
  } catch (dbError) {
    console.error("Failed to create database user, but auth registration succeeded:", dbError);
    // We continue anyway since auth is handled by Supabase
  }
  
  // Format the user data for response
  const formattedUser = formatUser(data.user, dbUser);
  
  // Return both the token and the formatted user
  return {
    access_token: data.session?.access_token || null,
    user: formattedUser
  };
}

// Login a user
export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  // Find or create the user in our database
  try {
    // Check if user exists in our database
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    
    // If user doesn't exist in our database yet, create them
    if (!dbUser) {
      const username = data.user?.user_metadata?.username || 
                     email.split('@')[0] + Math.floor(Math.random() * 10000);
      await createDatabaseUser(data.user, username);
    } else {
      // Update the updatedAt field (maps to updated_at in the database)
      await db.update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.email, email))
        .execute();
    }
  } catch (dbError) {
    console.error("Database error during login:", dbError);
    // Continue with login even if database operations fail
  }
  
  // Get formatted user with data from both auth and database
  const formattedUser = await findOrCreateDatabaseUser(data.user);
  
  // Return both the token and the formatted user
  return {
    access_token: data.session?.access_token || null,
    user: formattedUser || formatUser(data.user) // Fallback to auth user if DB user creation fails
  };
}

// Logout a user
export async function logoutUser(jwt: string) {
  const { error } = await supabase.auth.signOut({
    scope: 'global'
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Get a user by JWT token
export async function getUserByToken(jwt: string) {
  const { data, error } = await supabase.auth.getUser(jwt);
  
  if (error) {
    return null;
  }
  
  // Find this user in our database by email
  try {
    if (!data.user || !data.user.email) {
      console.error("Invalid user data from Supabase");
      return null;
    }
    
    // Direct database approach to avoid ORM issues
    try {
      const { pool } = require('../db');
      
      // Check if user exists first
      const existingResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [data.user.email]
      );
      
      if (existingResult.rows && existingResult.rows.length > 0) {
        // User exists - return the combined user object
        return formatUser(data.user, existingResult.rows[0]);
      } else {
        // User doesn't exist in database - create them
        const username = data.user.user_metadata?.username || 
                       (data.user.email.split('@')[0] + Math.floor(Math.random() * 10000));
        const tempPassword = Math.random().toString(36).slice(-10);
        
        const result = await pool.query(
          'INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [username, data.user.email, tempPassword, new Date(), new Date()]
        );
        
        if (result.rows && result.rows[0]) {
          console.log(`Created database user for ${data.user.email} during token check`);
          return formatUser(data.user, result.rows[0]);
        }
      }
    } catch (directDbError) {
      console.error("Direct database error getting user by token:", directDbError);
      // Try ORM as fallback
    }
    
    // Fallback to ORM approach if direct database query fails
    const dbUser = await db.query.users.findFirst({
      where: eq(users.email, data.user.email),
    });
    
    if (dbUser) {
      // Return a combined user object with data from both sources
      return formatUser(data.user, dbUser);
    } else {
      // Try to create a database user if none exists
      const username = data.user.user_metadata?.username || 
                     (data.user.email.split('@')[0] + Math.floor(Math.random() * 10000));
      const newDbUser = await createDatabaseUser(data.user, username);
      return formatUser(data.user, newDbUser);
    }
  } catch (dbError) {
    console.error("Error getting DB user by token:", dbError);
    // Fall back to just auth user if DB operations fail
    return formatUser(data.user);
  }
}

// Convert Supabase user to our application's user model
function formatUser(supabaseUser: any, dbUser: any = null): any {
  if (!supabaseUser) return null;
  
  // If we have a database user, use its data
  if (dbUser) {
    // Direct SQL queries return column names in snake_case, ORM returns camelCase
    // Handle both formats
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      // Add virtual properties not stored in the database
      role: "user", // Default role since it's not in our database
      status: "active", // Default status since it's not in our database
      lastLogin: new Date(), // Virtual property
      // Map from database field names to our response format - handle both camelCase and snake_case
      createdAt: dbUser.createdAt || dbUser.created_at || new Date(),
      updatedAt: dbUser.updatedAt || dbUser.updated_at || new Date()
    };
  }
  
  // If no database user provided, use Supabase user data
  return {
    id: parseInt(supabaseUser.id) || Math.floor(Math.random() * 1000000), // Convert string ID to number
    email: supabaseUser.email,
    username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
    // Add virtual properties not stored in the database
    role: "user",
    status: "active",
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Find or create a database user for a Supabase auth user using direct SQL
async function findOrCreateDatabaseUser(supabaseUser: any): Promise<any> {
  try {
    if (!supabaseUser || !supabaseUser.email) {
      console.error("Invalid Supabase user data");
      return null;
    }
    
    // Use direct SQL approach to avoid ORM schema issues
    try {
      const { pool } = require('../db');
      
      // Find the user first
      const existingResult = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [supabaseUser.email]
      );
      
      if (existingResult.rows && existingResult.rows.length > 0) {
        return existingResult.rows[0]; 
      }
      
      // If user doesn't exist, create them
      const username = supabaseUser.user_metadata?.username || 
                       (supabaseUser.email.split('@')[0] + Math.floor(Math.random() * 10000));
      
      // Create the user
      const result = await pool.query(
        'INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [username, supabaseUser.email, Math.random().toString(36).slice(-10), new Date(), new Date()]
      );
      
      if (result.rows && result.rows[0]) {
        console.log(`Created database user for ${supabaseUser.email} in findOrCreateDatabaseUser`);
        return result.rows[0];
      }
    } catch (directQueryError) {
      console.error("Direct query error in findOrCreateDatabaseUser:", directQueryError);
      // Fall back to trying the createDatabaseUser function which has different error handling
    }
    
    // If direct SQL approach failed, try the regular function
    const username = supabaseUser.user_metadata?.username || 
                     (supabaseUser.email.split('@')[0] + Math.floor(Math.random() * 10000));
    
    return await createDatabaseUser(supabaseUser, username);
  } catch (error) {
    console.error('Error finding/creating database user:', error);
    return null;
  }
}

// Middleware to authenticate requests
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1] || '';
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Verify the token and get the user
  getUserByToken(token)
    .then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      
      // Add the user to the request
      req['user'] = user;
      next();
    })
    .catch(error => {
      console.error('Auth error:', error);
      res.status(401).json({ message: 'Authentication failed' });
    });
}