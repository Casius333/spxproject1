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

// Create a user in our database
async function createDatabaseUser(supabaseUser: any, username: string) {
  try {
    if (!supabaseUser || !supabaseUser.email) {
      console.error("Cannot create database user without email");
      return null;
    }
    
    // Check if user already exists in our database by email
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, supabaseUser.email),
    });
    
    if (existingUser) {
      console.log(`User with email ${supabaseUser.email} already exists in database`);
      return existingUser;
    }
    
    // Create a temporary random password for the database record
    // (real authentication happens via Supabase JWT)
    const tempPassword = Math.random().toString(36).slice(-10);
    
    // Prepare user data
    const userData = {
      username: username,
      email: supabaseUser.email,
      password: tempPassword, // Just a placeholder since auth is handled by Supabase
      role: 'user',
      status: 'active',
      lastLogin: new Date(),
    };
    
    // Validate with schema
    const validatedData = usersInsertSchema.parse(userData);
    
    // Insert the user
    const [newUser] = await db.insert(users).values(validatedData).returning();
    console.log(`Created database user for ${supabaseUser.email}`);
    
    return newUser;
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
  
  // Register with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      }
    }
  });
  
  if (error) {
    throw new Error(error.message);
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
      // Update last login time
      await db.update(users)
        .set({ lastLogin: new Date() })
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
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      role: dbUser.role || 'user',
      status: dbUser.status || 'active',
      lastLogin: dbUser.lastLogin || new Date(),
      createdAt: dbUser.createdAt || new Date(),
      updatedAt: dbUser.updatedAt || new Date()
    };
  }
  
  // If no database user provided, use Supabase user data
  return {
    id: parseInt(supabaseUser.id) || Math.floor(Math.random() * 1000000), // Convert string ID to number
    email: supabaseUser.email,
    username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
    role: 'user',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Find or create a database user for a Supabase auth user
async function findOrCreateDatabaseUser(supabaseUser: any): Promise<any> {
  try {
    if (!supabaseUser || !supabaseUser.email) {
      console.error("Invalid Supabase user data");
      return null;
    }
    
    // Try to find the user first
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, supabaseUser.email),
    });
    
    if (existingUser) {
      return existingUser;
    }
    
    // If user doesn't exist, create them
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