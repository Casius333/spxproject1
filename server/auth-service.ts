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
    // Use email as username directly
    const username = email;
    
    let accessToken = null;
    let skipSupabaseAuth = false;
    let needsEmailVerification = false;
    
    // Try to create Supabase auth user (will be used for authentication)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${process.env.APP_URL || 'http://localhost:5000'}/auth/callback`
        }
      });
      
      if (error) {
        console.error("Supabase auth error:", error);
        
        // If email is invalid for Supabase but we want to allow test emails in development
        // Check if the error is specifically about email validation
        if (error.message.includes("Email address") && error.message.includes("invalid")) {
          console.log("Using database-only auth for development test email");
          skipSupabaseAuth = true;
        } else {
          throw new Error(error.message);
        }
      } else {
        // Check if email verification is needed
        if (data.user && !data.user.email_confirmed_at) {
          needsEmailVerification = true;
          console.log(`Email verification needed for: ${email}`);
        }
        
        accessToken = data.session?.access_token || null;
      }
    } catch (authError) {
      console.error("Error during Supabase auth:", authError);
      
      // For development/testing, we'll continue with database-only auth
      if (process.env.NODE_ENV !== 'production') {
        console.log("Continuing with database-only auth for development");
        skipSupabaseAuth = true;
      } else {
        throw authError;
      }
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
    
    // For development/testing without Supabase auth, generate a local token
    if (skipSupabaseAuth) {
      const localToken = `local_${databaseUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      accessToken = localToken;
    }
    
    // Return both the token and the user, along with verification status
    return {
      access_token: accessToken,
      user: user,
      verification_required: needsEmailVerification
    };
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
}

// Verify a user with OTP code
export async function verifyOtp(email: string, token: string) {
  console.log(`Verifying OTP for email: ${email}`);
  
  try {
    // Verify the OTP code with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (error) {
      console.error("OTP verification error:", error);
      throw new Error(error.message);
    }
    
    // If successful, get the user from database and return
    const databaseUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!databaseUser) {
      throw new Error("User not found in application database");
    }
    
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
    
    // Return the verification result
    return {
      access_token: data.session?.access_token || null,
      user: user,
      verified: true
    };
  } catch (error) {
    console.error("OTP verification error:", error);
    throw error;
  }
}

// Login a user
export async function loginUser(email: string, password: string) {
  console.log(`Login attempt for email: ${email}`);
  
  try {
    let accessToken = null;
    let skipSupabaseAuth = false;
    let needsEmailVerification = false;
    
    // First, retrieve user from our database
    const databaseUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!databaseUser) {
      throw new Error("User not found in application database");
    }
    
    // Try to authenticate with Supabase
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Supabase login error:", error);
        
        // Check if the error is about email verification
        if (error.message.includes("Email not confirmed")) {
          needsEmailVerification = true;
          throw new Error("Email not verified. Please check your email for verification code.");
        }
        
        // If email is invalid for Supabase but we want to allow test emails in development
        if (error.message.includes("Email") && (error.message.includes("invalid") || error.message.includes("not found"))) {
          console.log("Using database-only auth for development test email");
          skipSupabaseAuth = true;
        } else {
          throw new Error(error.message);
        }
      } else {
        // Check if user is verified in Supabase
        if (data.user && !data.user.email_confirmed_at) {
          needsEmailVerification = true;
          throw new Error("Email not verified. Please check your email for verification code.");
        }
        
        accessToken = data.session?.access_token || null;
      }
    } catch (authError: any) {
      console.error("Error during Supabase auth:", authError);
      
      // If we need email verification, propagate this error
      if (needsEmailVerification || (authError.message && authError.message.includes("Email not verified"))) {
        throw new Error("Email not verified. Please check your email for verification code.");
      }
      
      // For development/testing, we'll continue with database-only auth
      if (process.env.NODE_ENV !== 'production') {
        console.log("Continuing with database-only auth for development");
        skipSupabaseAuth = true;
      } else {
        throw authError;
      }
    }
    
    // For database-only auth, manually verify the password
    if (skipSupabaseAuth) {
      if (!verifyPassword(password, databaseUser.password)) {
        throw new Error("Invalid email or password");
      }
      
      // Generate a local token
      accessToken = `local_${databaseUser.id}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
      updatedAt: new Date(),
      // Add phoneNumber if it exists in the database record
      phoneNumber: databaseUser.phoneNumber || ''
    };
    
    console.log(`User logged in successfully: ${user.username} (ID: ${user.id})`);
    
    // Return both the token and the user, along with verification information
    return {
      access_token: accessToken,
      user: user,
      verification_required: needsEmailVerification
    };
  } catch (error) {
    console.error("Login error:", error);
    
    // Check if this is a verification error and provide helpful info
    if (error instanceof Error && error.message.includes("Email not verified")) {
      throw new Error(error.message);
    }
    
    throw error;
  }
}

// Logout a user
export async function logoutUser(token: string) {
  console.log("Logging out user");
  
  try {
    // Check if this is a local token (for development/testing)
    if (token.startsWith('local_')) {
      console.log('Local token user logged out successfully');
      return true;
    }
    
    // For regular tokens, log out from Supabase
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
    // Check if this is a local token (for development/testing)
    if (token.startsWith('local_')) {
      // Extract user ID from the token (format: local_USER_ID_timestamp_random)
      const parts = token.split('_');
      if (parts.length >= 2) {
        const userId = parseInt(parts[1], 10);
        
        // Find user by ID
        const databaseUser = await db.query.users.findFirst({
          where: eq(users.id, userId)
        });
        
        if (databaseUser) {
          return {
            id: databaseUser.id,
            email: databaseUser.email,
            username: databaseUser.username,
            role: "user",
            status: "active",
            lastLogin: new Date(),
            createdAt: databaseUser.createdAt,
            updatedAt: databaseUser.updatedAt,
            phoneNumber: databaseUser.phoneNumber || ''
          };
        }
      }
      
      return null;
    }
    
    // For regular tokens, get user from Supabase
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
      updatedAt: databaseUser.updatedAt,
      phoneNumber: databaseUser.phoneNumber || ''
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