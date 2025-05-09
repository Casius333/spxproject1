import { supabase } from '../lib/supabase';
import { User } from '@shared/schema';
import { Request, Response, NextFunction } from 'express';

// User type that matches the Supabase auth user
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    username?: string;
  };
}

// Register a new user
export async function registerUser(email: string, password: string) {
  const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
  
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
  
  // Return both the token and the formatted user
  return {
    access_token: data.session?.access_token || null,
    user: formatUser(data.user)
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
  
  // Return both the token and the formatted user
  return {
    access_token: data.session?.access_token || null,
    user: formatUser(data.user)
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
  
  return formatUser(data.user);
}

// Convert Supabase user to our application's user model
function formatUser(user: any): any {
  if (!user) return null;
  
  // Return a simplified user object that matches our needs
  return {
    id: parseInt(user.id) || Math.floor(Math.random() * 1000000), // Convert string ID to number
    email: user.email,
    username: user.user_metadata?.username || user.email.split('@')[0],
    // Add any other required fields with defaults
    role: 'user',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
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