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
    // Import pool for direct SQL queries
    const { pool } = await import('../db');
    
    // Check if user already exists using direct SQL
    const existingUser = await pool.query(
      `SELECT id, username, email, password, created_at, updated_at FROM users WHERE email = $1`,
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      console.log(`User with email ${email} already exists in database`);
      return {
        id: existingUser.rows[0].id,
        username: existingUser.rows[0].username,
        email: existingUser.rows[0].email,
        password: existingUser.rows[0].password,
        createdAt: existingUser.rows[0].created_at,
        updatedAt: existingUser.rows[0].updated_at
      };
    }
    
    // Create the user using direct SQL to avoid phone_number column issue
    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, password, created_at, updated_at`,
      [username, email, hashedPassword, new Date(), new Date()]
    );
    
    console.log(`Created database user for ${email}`);
    
    // Return first row from the result
    return {
      id: newUser.rows[0].id,
      username: newUser.rows[0].username,
      email: newUser.rows[0].email,
      password: newUser.rows[0].password,
      createdAt: newUser.rows[0].created_at,
      updatedAt: newUser.rows[0].updated_at
    };
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
    
    // First, retrieve user from our database using direct SQL query
    // to avoid the phone_number column issue
    const { pool } = await import('../db');
    const userResult = await pool.query(
      `SELECT id, email, username, password, created_at, updated_at 
       FROM users WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error("User not found in application database");
    }
    
    const databaseUser = {
      id: userResult.rows[0].id,
      email: userResult.rows[0].email,
      username: userResult.rows[0].username,
      password: userResult.rows[0].password,
      createdAt: userResult.rows[0].created_at,
      updatedAt: userResult.rows[0].updated_at
    };
    
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
    // Try to get phone_number if it exists
    let phoneNumber = '';
    try {
      // Use pool to directly query the phone_number column if it exists
      const { pool } = await import('../db');
      const phoneResult = await pool.query(
        `SELECT phone_number FROM users WHERE id = $1`,
        [databaseUser.id]
      );
      
      // Use optional chaining to safely access the phone_number
      phoneNumber = phoneResult.rows[0]?.phone_number || '';
    } catch (error) {
      // If phone_number column doesn't exist, just use empty string
      console.log('Phone number column might not exist yet:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    const user = {
      id: databaseUser.id,
      email: databaseUser.email,
      username: databaseUser.username,
      role: "user",
      status: "active",
      lastLogin: new Date(),
      createdAt: databaseUser.createdAt,
      updatedAt: new Date(),
      phoneNumber
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
        
        // Find user by ID using direct SQL to avoid phone_number column issue
        const { pool } = await import('../db');
        const userResult = await pool.query(
          `SELECT id, email, username, created_at, updated_at
           FROM users WHERE id = $1`,
          [userId]
        );
        
        if (userResult.rows.length > 0) {
          try {
            // Try to get phone_number if it exists
            const phoneResult = await pool.query(
              `SELECT phone_number FROM users WHERE id = $1`,
              [userId]
            );
            
            const phoneNumber = phoneResult.rows[0]?.phone_number || '';
            
            return {
              id: userResult.rows[0].id,
              email: userResult.rows[0].email,
              username: userResult.rows[0].username,
              role: "user",
              status: "active",
              lastLogin: new Date(),
              createdAt: userResult.rows[0].created_at,
              updatedAt: userResult.rows[0].updated_at,
              phoneNumber: phoneNumber
            };
          } catch (error) {
            // If can't get phone_number, return without it
            return {
              id: userResult.rows[0].id,
              email: userResult.rows[0].email,
              username: userResult.rows[0].username,
              role: "user",
              status: "active",
              lastLogin: new Date(),
              createdAt: userResult.rows[0].created_at,
              updatedAt: userResult.rows[0].updated_at,
              phoneNumber: ''
            };
          }
        }
      }
      
      return null;
    }
    
    // For regular tokens, get user from Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return null;
    }
    
    // Find user in our database using direct SQL to avoid phone_number column issue
    const { pool } = await import('../db');
    const userResult = await pool.query(
      `SELECT id, email, username, created_at, updated_at
       FROM users WHERE email = $1`,
      [data.user.email || '']
    );
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    // Try to get phone_number if it exists
    try {
      const phoneResult = await pool.query(
        `SELECT phone_number FROM users WHERE id = $1`,
        [userResult.rows[0].id]
      );
      
      const phoneNumber = phoneResult.rows[0]?.phone_number || '';
      
      // Create a user response object
      return {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        username: userResult.rows[0].username,
        role: "user",
        status: "active",
        lastLogin: new Date(),
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at,
        phoneNumber: phoneNumber
      };
    } catch (error) {
      // If we can't get phone_number, return user without it
      return {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        username: userResult.rows[0].username,
        role: "user",
        status: "active",
        lastLogin: new Date(),
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at,
        phoneNumber: ''
      };
    }
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