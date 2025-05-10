import { supabase } from '../lib/supabase';
import { db } from '../db';
import { Request, Response, NextFunction } from 'express';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import * as crypto from 'crypto';

// Function to generate a secure password hash
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return `${hash}.${salt}`;
}

// Function to verify a password against a hash
function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const [hash, salt] = hashedPassword.split('.');
  const calculatedHash = crypto.createHash('sha256').update(plainPassword + salt).digest('hex');
  return hash === calculatedHash;
}

// Create a user in our database
async function createDatabaseUser(email: string, username: string, hashedPassword: string) {
  console.log(`Creating database user: ${username} (${email})`);
  
  try {
    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (existingUser) {
      console.log(`User with email ${email} already exists in database`);
      return existingUser;
    }
    
    // Create the user
    const [newUser] = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    console.log(`Created database user for ${email}`);
    return newUser;
  } catch (error) {
    console.error("Error creating database user:", error);
    throw error;
  }
}

// Register a new user
export async function registerUser(email: string, password: string) {
  console.log(`Registering user with email: ${email}`);
  
  try {
    // Generate username from email (username@example.com -> username1234)
    const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
    
    // Create Supabase auth user (will be used for authentication)
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
      console.error("Supabase auth error:", error);
      throw new Error(error.message);
    }
    
    // Create user in our application database (will be used for app data)
    const hashedPassword = hashPassword(password);
    const databaseUser = await createDatabaseUser(email, username, hashedPassword);
    
    // Create a user response object
    const user = {
      id: databaseUser.id,
      email: databaseUser.email,
      username: databaseUser.username,
      role: "user",
      status: "active",
      lastLogin: new Date(),
      createdAt: databaseUser.createdAt,
      updatedAt: databaseUser.updatedAt
    };
    
    console.log(`User registered successfully: ${username} (ID: ${user.id})`);
    
    // Return both the token and the user
    return {
      access_token: data.session?.access_token || null,
      user: user
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Login a user
export async function loginUser(email: string, password: string) {
  console.log(`Login attempt for email: ${email}`);
  
  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error("Supabase login error:", error);
      throw new Error(error.message);
    }
    
    // Retrieve user from our database
    const databaseUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!databaseUser) {
      throw new Error("User not found in application database");
    }
    
    // Update last login
    await db.update(users)
      .set({ updatedAt: new Date() })
      .where(eq(users.id, databaseUser.id));
    
    // Create a user response object
    const user = {
      id: databaseUser.id,
      email: databaseUser.email,
      username: databaseUser.username,
      role: "user",
      status: "active",
      lastLogin: new Date(),
      createdAt: databaseUser.createdAt,
      updatedAt: new Date()
    };
    
    console.log(`User logged in successfully: ${user.username} (ID: ${user.id})`);
    
    // Return both the token and the user
    return {
      access_token: data.session?.access_token || null,
      user: user
    };
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

// Logout a user
export async function logoutUser(token: string) {
  console.log("Logging out user");
  
  try {
    // Log out from Supabase
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("Supabase logout error:", error);
      throw new Error(error.message);
    }
    
    console.log('User logged out successfully');
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Get a user by token
export async function getUserByToken(token: string) {
  if (!token) {
    return null;
  }
  
  try {
    // Get user from Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    // Find user in our database
    const databaseUser = await db.query.users.findFirst({
      where: eq(users.email, data.user.email || '')
    });
    
    if (!databaseUser) {
      return null;
    }
    
    // Create a user response object
    return {
      id: databaseUser.id,
      email: databaseUser.email,
      username: databaseUser.username,
      role: "user",
      status: "active",
      lastLogin: new Date(),
      createdAt: databaseUser.createdAt,
      updatedAt: databaseUser.updatedAt
    };
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

// Middleware to authenticate requests
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1] || '';
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
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