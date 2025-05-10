import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// In-memory store for users and tokens
const users = new Map();
const tokens = new Map();

// Generate a JWT-like token
function generateToken(userId: number): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const token = `sim_jwt_${userId}_${randomBytes}`;
  tokens.set(token, userId);
  return token;
}

// Register a new user
export async function registerUser(email: string, password: string) {
  console.log(`Registering user with email: ${email}`);
  
  // Check if user already exists
  const existingUser = Array.from(users.values()).find(
    (user: any) => user.email === email
  );
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Generate username from email (username@example.com -> username1234)
  const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
  
  // Create a new user
  const userId = users.size + 1;
  const hashedPassword = hashPassword(password);
  
  const user = {
    id: userId,
    email,
    username,
    password: hashedPassword,
    role: 'user',
    status: 'active',
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Store the user
  users.set(userId, user);
  
  // Generate token
  const token = generateToken(userId);
  
  console.log(`User registered successfully: ${username} (ID: ${userId})`);
  
  // Return both the token and the user (without password)
  const { password: _, ...userWithoutPassword } = user;
  return {
    access_token: token,
    user: userWithoutPassword
  };
}

// Login a user
export async function loginUser(email: string, password: string) {
  console.log(`Login attempt for email: ${email}`);
  
  // Find user by email
  const user = Array.from(users.values()).find(
    (user: any) => user.email === email
  );
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  if (!verifyPassword(password, user.password)) {
    throw new Error('Invalid email or password');
  }
  
  // Update last login
  user.lastLogin = new Date();
  
  // Generate token
  const token = generateToken(user.id);
  
  console.log(`User logged in successfully: ${user.username} (ID: ${user.id})`);
  
  // Return both the token and the user (without password)
  const { password: _, ...userWithoutPassword } = user;
  return {
    access_token: token,
    user: userWithoutPassword
  };
}

// Logout a user
export async function logoutUser(token: string) {
  // Remove token from store
  if (tokens.has(token)) {
    tokens.delete(token);
    console.log('User logged out successfully');
  }
  
  return true;
}

// Get a user by token
export async function getUserByToken(token: string) {
  if (!token || !tokens.has(token)) {
    return null;
  }
  
  const userId = tokens.get(token);
  const user = users.get(userId);
  
  if (!user) {
    return null;
  }
  
  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
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

// Password hashing (simplified for demo)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHash('sha256').update(password + salt).digest('hex');
  return `${hash}.${salt}`;
}

// Verify password
function verifyPassword(plainPassword: string, hashedPassword: string): boolean {
  const [hash, salt] = hashedPassword.split('.');
  const calculatedHash = crypto.createHash('sha256').update(plainPassword + salt).digest('hex');
  return hash === calculatedHash;
}

// Create a default test user on startup
(function createDefaultUser() {
  if (users.size === 0) {
    registerUser('test@example.com', 'password123')
      .then(() => console.log('Default test user created'))
      .catch(err => console.error('Error creating default user:', err));
  }
})();