import { createHash, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { adminUsers, type AdminUser } from '../shared/schema';
import { Request, Response, NextFunction } from 'express';

// JWT secret key - would normally be in environment variables
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-for-development';
const JWT_EXPIRES_IN = '24h';

// Hash a password using the same method as in seed.ts
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Verify a password
export function comparePasswords(plainPassword: string, hashedPassword: string): boolean {
  const hashedInput = createHash('sha256').update(plainPassword).digest('hex');
  return hashedInput === hashedPassword;
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
}): Promise<AdminUser> {
  const hashedPassword = hashPassword(admin.password);
  
  const result = await db.insert(adminUsers).values({
    username: admin.username,
    email: admin.email,
    password: hashedPassword,
    role: admin.role || 'admin'
  }).returning();
  
  return result[0];
}

// Generate a JWT token for an admin
export function generateToken(admin: AdminUser): string {
  const payload = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify a JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Login an admin
export async function loginAdmin(username: string, password: string): Promise<{ admin: AdminUser; token: string } | null> {
  const admin = await getAdminByUsername(username);
  
  if (!admin || !admin.isActive) {
    return null;
  }
  
  const isPasswordValid = comparePasswords(password, admin.password);
  
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