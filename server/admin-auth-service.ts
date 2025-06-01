import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { adminUsers, type AdminUser } from '../shared/schema';
import { Request, Response, NextFunction } from 'express';

// Environment variable validation with secure fallback
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || (() => {
  console.warn('ADMIN_JWT_SECRET not set, generating secure random key for this session');
  return crypto.randomBytes(64).toString('hex');
})();

const JWT_EXPIRES_IN = '8h'; // Reduced from 24h for better security
const SALT_ROUNDS = 12;

// Hash a password using bcrypt (secure)
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify a password using bcrypt
export async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
}

// Get admin by ID
export async function getAdminById(id: number): Promise<AdminUser | undefined> {
  const results = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return results[0];
}

// Get admin by username or email
export async function getAdminByUsername(username: string): Promise<AdminUser | undefined> {
  // First try to find by username
  const resultsByUsername = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  if (resultsByUsername.length > 0) {
    return resultsByUsername[0];
  }
  
  // If not found, try by email
  const resultsByEmail = await db.select().from(adminUsers).where(eq(adminUsers.email, username));
  return resultsByEmail[0];
}

// Create a new admin user
export async function createAdmin(admin: {
  username: string;
  email: string;
  password: string;
  role?: string;
  active?: boolean;
}): Promise<AdminUser> {
  const hashedPassword = await hashPassword(admin.password);
  
  const result = await db.insert(adminUsers).values({
    username: admin.username,
    email: admin.email,
    password: hashedPassword,
    role: admin.role || 'admin',
    active: admin.active !== undefined ? admin.active : true
  }).returning();
  
  return result[0];
}

// Generate a JWT token for an admin
export function generateToken(admin: AdminUser): string {
  const payload = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    iat: Math.floor(Date.now() / 1000), // Issued at time
    jti: crypto.randomUUID() // Unique token ID for revocation capability
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'luckypunt-admin',
    audience: 'luckypunt-admin-panel'
  });
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'luckypunt-admin',
      audience: 'luckypunt-admin-panel'
    });
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// Login an admin
export async function loginAdmin(username: string, password: string): Promise<{ admin: AdminUser; token: string } | null> {
  const admin = await getAdminByUsername(username);
  
  if (!admin || !admin.active) {
    return null;
  }
  
  const isPasswordValid = await comparePasswords(password, admin.password);
  
  if (!isPasswordValid) {
    return null;
  }
  
  // Update last login time
  await db.update(adminUsers)
    .set({ lastLogin: new Date(), updatedAt: new Date() })
    .where(eq(adminUsers.id, admin.id));
  
  const token = generateToken(admin);
  
  return { admin, token };
}

// Authentication middleware
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  // Get the token from the request headers
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verify the token
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
  
  // Add the admin to the request object
  (req as any).admin = decoded;
  
  next();
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const admin = (req as any).admin;
    
    if (!admin) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(admin.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    
    next();
  };
}