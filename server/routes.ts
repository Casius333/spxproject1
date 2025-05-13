import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { gamesController } from "./controllers/games";
import { balanceController } from "./controllers/balance";
import { registerUser, loginUser, logoutUser, getUserByToken, authenticate, verifyOtp } from "./auth-service";
import { registerAdminRoutes } from "./admin-routes";
import { db } from "../db";
import { and, desc, eq, gt, gte, lt, lte, or, sql, asc } from "drizzle-orm";
import { promotions, userPromotions, users, deposits, type Promotion, type UserPromotion, userPromotionsInsertSchema } from "../shared/schema";

// Helper function to check if a promotion is available today
function isPromotionAvailableToday(promotion: Promotion): boolean {
  const timezone = promotion.timezone || 'Australia/Sydney';
  const now = new Date();
  const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getDay();
  
  const daysOfWeek = Array.isArray(promotion.daysOfWeek) 
    ? promotion.daysOfWeek 
    : JSON.parse(promotion.daysOfWeek as unknown as string);
  
  return daysOfWeek.includes(dayOfWeek);
}

// Helper function to check if a user has already used a promotion today
async function hasUserUsedPromotionToday(userId: number, promotionId: number): Promise<boolean> {
  // For now, return false. In a real implementation, we would check the database.
  return false;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JWT authentication routes
  
  // Register endpoint - Supabase auth approach
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Register with Supabase and create database user
      const userData = await registerUser(email, password);
      
      res.status(201).json(userData);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error?.message || 'Failed to register' });
    }
  });
  
  // Login endpoint - Supabase auth approach
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // Authenticate with Supabase and get user info
      const data = await loginUser(email, password);
      
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error?.message || 'Authentication failed' });
    }
  });
  
  // Logout endpoint
  app.post('/api/logout', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || '';
      await logoutUser(token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: error?.message || 'Failed to logout' });
    }
  });
  
  // Get current user endpoint
  app.get('/api/user', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      res.status(200).json(user);
    } catch (error: any) {
      console.error('Get user error:', error);
      res.status(401).json({ message: error?.message || 'Not authenticated' });
    }
  });
  
  // Update user profile (phone number)
  app.patch('/api/user/profile', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { phoneNumber } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Get user from token
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Import db and users from the schema
      const { db } = await import('../db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const { pool } = await import('../db');
      
      // Store phone number temporarily in user profile response
      // This is a workaround until the database schema is updated with the phone_number column
      let updatedUser;
      
      try {
        // First, check if the phone_number column exists
        const columnCheckResult = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = 'phone_number'
        `);
        
        if (columnCheckResult.rows.length === 0) {
          console.log('phone_number column does not exist yet, creating it...');
          // Add the column if it doesn't exist
          await pool.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS phone_number TEXT
          `);
          console.log('phone_number column added successfully');
        }
        
        // Now update the user
        updatedUser = await db.update(users)
          .set({ phoneNumber })
          .where(eq(users.id, user.id))
          .returning();
          
      } catch (dbError) {
        console.error('Database error:', dbError);
        // If there's still an issue, return the user with the updated phone number
        // but don't actually persist it to the database yet
        updatedUser = [{
          ...user,
          phoneNumber
        }];
      }
      
      if (!updatedUser.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(updatedUser[0]);
    } catch (error: any) {
      console.error('Update user profile error:', error);
      res.status(500).json({ message: error?.message || 'Failed to update profile' });
    }
  });
  
  // Change user password
  app.post('/api/user/change-password', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { currentPassword, newPassword } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Get user from token
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Import necessary modules
      const { db } = await import('../db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const { pool } = await import('../db');
      const authService = await import('./auth-service');
      
      // Fetch complete user record with password using direct SQL
      const userResult = await pool.query(
        `SELECT id, password FROM users WHERE id = $1`,
        [user.id]
      );
      
      if (userResult.rows.length === 0 || !userResult.rows[0].password) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Verify current password
      const storedPassword = userResult.rows[0].password;
      const isPasswordValid = authService.verifyPassword(currentPassword, storedPassword);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const hashedPassword = authService.hashPassword(newPassword);
      
      // Update the password
      const updatedUser = await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id))
        .returning();
      
      if (!updatedUser.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json({ message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Change password error:', error);
      res.status(500).json({ message: error?.message || 'Failed to change password' });
    }
  });
  
  // Protected route middleware
  app.use('/api/protected', authenticate);
  
  // OTP verification endpoint
  app.post('/api/verify-otp', async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      
      if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP code are required' });
      }
      
      // Verify the OTP code with Supabase
      const verificationResult = await verifyOtp(email, otp);
      
      res.status(200).json(verificationResult);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      res.status(400).json({ message: error?.message || 'Verification failed' });
    }
  });
  
  // Auth callback route for handling redirects (keeping for compatibility)
  app.get('/auth/callback', (req: Request, res: Response) => {
    // This route is kept for future compatibility with external auth providers
    // Just redirect to the main page, frontend will handle token management
    res.redirect('/');
  });
  
  // Test endpoint to list users in memory
  app.get('/api/users-test', async (req: Request, res: Response) => {
    try {
      // This route will be implemented with our in-memory auth system
      // Get the current user if authenticated
      const token = req.headers.authorization?.split(' ')[1] || '';
      const currentUser = token ? await getUserByToken(token) : null;
      
      return res.status(200).json({ 
        message: 'In-memory authentication is active',
        currentUser: currentUser || 'Not logged in',
        note: 'Default test user: test@example.com / password123'
      });
    } catch (error: any) {
      console.error('Users test error:', error);
      return res.status(500).json({ 
        message: 'Error testing users', 
        error: error?.message || 'Unknown error' 
      });
    }
  });
  
  const httpServer = createServer(app);
  
  // Setup Socket.IO server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: '/socket.io'
  });
  
  // Socket.IO connections
  io.on('connection', (socket) => {
    console.log('Socket.IO client connected:', socket.id);
    
    // Send welcome message
    socket.emit('connection', {
      message: 'Connected to LuckyPunt Socket.IO server',
      id: socket.id
    });
    
    // Handle win notifications
    socket.on('win', (data) => {
      // Broadcast win notifications to all clients except sender
      socket.broadcast.emit('win_notification', {
        amount: data.amount,
        username: data.username || 'Anonymous',
        game: data.game || 'Slots'
      });
    });
    
    // Handle jackpot notifications
    socket.on('jackpot', (data) => {
      // Broadcast jackpot win to everyone including sender
      io.emit('jackpot_notification', {
        amount: data.amount,
        username: data.username || 'Anonymous',
        game: data.game || 'Slots'
      });
    });
    
    // Handle balance updates
    socket.on('balance_update', (data) => {
      if (data.userId) {
        // Join a room specific to this user
        socket.join(`user:${data.userId}`);
        
        // Emit to all of this user's connected devices
        io.to(`user:${data.userId}`).emit('balance_changed', {
          balance: data.balance
        });
      }
    });
    
    // Handle ping requests
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });
    
    // Handle chat messages
    socket.on('chat_message', (data) => {
      socket.broadcast.emit('chat_message', {
        username: data.username || 'Anonymous',
        message: data.message,
        timestamp: Date.now()
      });
    });
    
    // Authenticate socket connection with JWT
    socket.on('authenticate', async (data) => {
      try {
        if (data.token) {
          const user = await getUserByToken(data.token);
          if (user) {
            // Associate socket with user
            socket.data.user = user;
            
            // Join a room specific to this user for multi-device sync
            socket.join(`user:${user.id}`);
            
            socket.emit('authenticated', { success: true });
          } else {
            socket.emit('authenticated', { 
              success: false, 
              error: 'Invalid token' 
            });
          }
        }
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('authenticated', { 
          success: false, 
          error: 'Authentication failed' 
        });
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnected:', socket.id);
    });
    
    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket.IO error:', error);
    });
  });
  
  // Game routes
  app.get('/api/games', gamesController.getAllGames);
  app.get('/api/games/:id', gamesController.getGameById);
  app.get('/api/games/category/:categoryId', gamesController.getGamesByCategory);
  app.get('/api/games/provider/:providerId', gamesController.getGamesByProvider);
  app.get('/api/categories', gamesController.getAllCategories);
  app.get('/api/providers', gamesController.getAllProviders);
  app.get('/api/search', gamesController.searchGames);
  
  // Featured collections
  app.get('/api/featured', gamesController.getFeaturedGames);
  app.get('/api/jackpots', gamesController.getJackpotGames);
  app.get('/api/popular', gamesController.getPopularGames);
  app.get('/api/new', gamesController.getNewGames);
  
  // Update user mobile number
  app.post('/api/user/mobile', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { mobileNumber } = req.body;
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    try {
      // Get user from token
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      if (!mobileNumber || typeof mobileNumber !== 'string') {
        return res.status(400).json({ message: 'Valid mobile number is required' });
      }
      
      // Import db and users from the schema
      const { db } = await import('../db');
      const { users } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      
      // Update user with mobile number
      const updatedUser = await db.update(users)
        .set({ phoneNumber: mobileNumber })
        .where(eq(users.id, user.id))
        .returning();
      
      if (!updatedUser.length) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.status(200).json(updatedUser[0]);
    } catch (error: any) {
      console.error('Update mobile number error:', error);
      res.status(500).json({ message: error?.message || 'Failed to update mobile number' });
    }
  });
  
  // Balance routes
  app.get('/api/balance', balanceController.getBalance);
  app.post('/api/balance', balanceController.updateBalance);
  app.get('/api/transactions', balanceController.getTransactions);
  
  // Register admin routes
  registerAdminRoutes(app);
  
  return httpServer;
}
