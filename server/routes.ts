import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { gamesController } from "./controllers/games";
import { balanceController } from "./controllers/balance";
import { registerUser, loginUser, logoutUser, getUserByToken, authenticate, verifyOtp } from "./auth-service";
import { registerAdminRoutes } from "./admin-routes";
import { authLimiter, generalLimiter } from './middleware/rateLimiting';
import { body, validationResult } from 'express-validator';
import { db } from "../db";
import { and, desc, eq, gt, gte, lt, lte, or, sql, asc } from "drizzle-orm";
import { promotions, userPromotions, users, deposits, transactions, type Promotion, type UserPromotion, userPromotionsInsertSchema } from "../shared/schema";

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

// Helper function to broadcast balance updates via Socket.IO
// Export this so it can be imported from other files
export async function broadcastBalanceUpdate(
  io: SocketIOServer, 
  userId: number, 
  totalBalance: number, 
  balanceBreakdown: any, 
  type: 'bet' | 'win' | 'deposit' | 'bonus' | 'update' = 'update',
  amount: number = 0
) {
  if (!io) {
    console.log('No Socket.IO instance available for balance update broadcast');
    return;
  }
  
  // Ensure we have all required data
  const payload = {
    balance: totalBalance,
    userId,
    type,
    amount,
    bonusBalance: balanceBreakdown.bonusBalance || 0,
    availableForWithdrawal: balanceBreakdown.availableForWithdrawal !== undefined ? 
      balanceBreakdown.availableForWithdrawal : 
      (balanceBreakdown.hasActiveBonus ? 0 : totalBalance - (balanceBreakdown.bonusBalance || 0)),
    hasActiveBonus: balanceBreakdown.hasActiveBonus || false
  };
  
  console.log(`Broadcasting balance update: ${JSON.stringify(payload)}`);
  
  // Broadcast to all connected clients (global events)
  // For devices connected with balance_changed handler
  io.emit('balance_changed', payload);
  
  // For devices connected with balance_update handler
  io.emit('balance_update', payload);
  
  // Also broadcast to user-specific room for multi-device syncing
  io.to(`user:${userId}`).emit('balance_changed', payload);
  io.to(`user:${userId}`).emit('balance_update', payload);
}

// Helper function to check if a user has already used a promotion today
async function hasUserUsedPromotionToday(userId: number, promotionId: number): Promise<boolean> {
  try {
    console.log('Checking if user has used promotion today:', { userId, promotionId });
    
    // Get today's date in the promotion's timezone (defaulting to Sydney timezone)
    const timezone = 'Australia/Sydney'; // Default timezone
    const now = new Date();
    const todayStart = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    todayStart.setHours(0, 0, 0, 0);
    
    // Check if the user has any active or completed promotion from today
    // Only count active or completed promotions as "used" for the day
    const result = await db.select()
      .from(userPromotions)
      .where(
        and(
          eq(userPromotions.userId, userId),
          eq(userPromotions.promotionId, promotionId),
          gte(userPromotions.createdAt, todayStart),
          or(
            eq(userPromotions.status, 'active'),
            eq(userPromotions.status, 'completed')
          )
        )
      );
    
    const hasUsed = result.length > 0;
    console.log('User has used promotion today:', hasUsed);
    return hasUsed;
  } catch (error) {
    console.error('Error checking promotion usage:', error);
    // In case of error, return false to allow the user to use the promotion
    return false;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JWT authentication routes
  
  // Input validation middleware
  const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ];

  const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ];

  // Validation error handler
  const handleValidationErrors = (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }
    next();
  };

  // Register endpoint - Supabase auth approach with security enhancements
  app.post('/api/register', 
    authLimiter, 
    registerValidation, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
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
  
  // Login endpoint - Supabase auth approach with security enhancements
  app.post('/api/login', 
    authLimiter, 
    loginValidation, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      // Authenticate with Supabase and get user info
      const data = await loginUser(email, password);
      
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({ message: error?.message || 'Authentication failed' });
    }
  });
  
  // Logout endpoint with rate limiting
  app.post('/api/logout', 
    generalLimiter, 
    async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.split(' ')[1] || '';
      await logoutUser(token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error: any) {
      console.error('Logout error:', error);
      res.status(500).json({ message: error?.message || 'Failed to logout' });
    }
  });
  
  // Get current user endpoint with rate limiting
  app.get('/api/user', 
    generalLimiter, 
    async (req: Request, res: Response) => {
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
  
  // Additional validation rules
  const passwordChangeValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ];

  const profileUpdateValidation = [
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number is required')
  ];

  // Change user password with security enhancements
  app.post('/api/user/change-password', 
    authLimiter, 
    passwordChangeValidation, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
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
  
  // Make the io instance available throughout the app
  app.set('socketio', io);
  
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
        
        // Emit to all of this user's connected devices using both event types
        io.to(`user:${data.userId}`).emit('balance_changed', {
          balance: data.balance,
          bonusBalance: data.bonusBalance,
          realBalance: data.realBalance,
          availableForWithdrawal: data.availableForWithdrawal,
          hasActiveBonus: data.hasActiveBonus
        });
        
        // Also emit with balance_update for backwards compatibility
        io.to(`user:${data.userId}`).emit('balance_update', {
          balance: data.balance,
          bonusBalance: data.bonusBalance,
          realBalance: data.realBalance,
          availableForWithdrawal: data.availableForWithdrawal,
          hasActiveBonus: data.hasActiveBonus,
          type: data.type || 'update',
          amount: data.amount || 0
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
  
  // Mobile number validation
  const mobileUpdateValidation = [
    body('mobileNumber').isMobilePhone('any').withMessage('Valid mobile number is required')
  ];

  // Update user mobile number with security enhancements
  app.post('/api/user/mobile', 
    generalLimiter, 
    mobileUpdateValidation, 
    handleValidationErrors, 
    async (req: Request, res: Response) => {
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
  
  // Promotions routes for users with rate limiting
  app.get('/api/promotions', 
    generalLimiter, 
    async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    let userId: number | null = null;
    
    // Try to get the user ID if authenticated
    if (token) {
      try {
        const user = await getUserByToken(token);
        if (user) {
          userId = user.id;
        }
      } catch (error) {
        console.error('Error getting user from token:', error);
        // Continue with userId as null - will just show available promotions
      }
    }
    
    try {
      // Get all active promotions
      const activePromotions = await db.query.promotions.findMany({
        where: eq(promotions.active, true),
        orderBy: [desc(promotions.createdAt)]
      });
      
      // Filter promotions that are available today
      const availablePromotions = activePromotions.filter(promo => 
        isPromotionAvailableToday(promo)
      );
      
      // If the user is authenticated, include information about which promotions
      // they've already used and get their active promotions
      let userPromotionsData: UserPromotion[] = [];
      
      if (userId) {
        userPromotionsData = await db.query.userPromotions.findMany({
          where: eq(userPromotions.userId, userId)
        });
      }
      
      // Format the response by mapping promotions with user-specific data
      const formattedPromotions = availablePromotions.map(promo => {
        // Find if user has this promotion active
        const activeUserPromotion = userPromotionsData.find(
          up => up.promotionId === promo.id && up.status === 'active'
        );
        
        // Calculate turnover progress if the promotion is active
        let progress = 0;
        let wagered = 0;
        if (activeUserPromotion) {
          wagered = activeUserPromotion.wagered || 0;
          const required = promo.turnoverRequirement || 0;
          progress = required > 0 ? Math.min(100, (wagered / required) * 100) : 100;
        }
        
        return {
          ...promo,
          isUsed: userPromotionsData.some(up => 
            up.promotionId === promo.id && 
            up.activatedAt && 
            new Date(up.activatedAt).toDateString() === new Date().toDateString()
          ),
          isActive: !!activeUserPromotion,
          progress,
          wagered,
          activatedAt: activeUserPromotion?.activatedAt || null
        };
      });
      
      res.status(200).json(formattedPromotions);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
      res.status(500).json({ message: error?.message || 'Failed to fetch promotions' });
    }
  });
  
  // Get user's active promotions
  app.get('/api/user/promotions', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get user's active promotions with promotion details
      const userActivePromotions = await db.query.userPromotions.findMany({
        where: and(
          eq(userPromotions.userId, user.id),
          eq(userPromotions.status, 'active')
        ),
        with: {
          promotion: true
        }
      });
      
      // Format response with progress information
      const formattedActivePromotions = userActivePromotions.map(up => {
        const progress = up.promotion.turnoverRequirement > 0 
          ? Math.min(100, ((up.wagered || 0) / (up.promotion.turnoverRequirement || 1)) * 100) 
          : 100;
          
        return {
          id: up.id,
          promotionId: up.promotionId,
          activated: up.activatedAt,
          wagered: up.wagered || 0,
          requiredTurnover: up.promotion.turnoverRequirement,
          progress,
          promotionName: up.promotion.name,
          bonusValue: up.promotion.bonusValue,
          bonusType: up.promotion.bonusType,
          description: up.promotion.description,
          imageUrl: up.promotion.imageUrl
        };
      });
      
      res.status(200).json(formattedActivePromotions);
    } catch (error: any) {
      console.error('Error fetching user promotions:', error);
      res.status(500).json({ message: error?.message || 'Failed to fetch user promotions' });
    }
  });
  
  // Activate a promotion
  app.post('/api/promotions/:id/activate', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const promotionId = parseInt(req.params.id);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (isNaN(promotionId)) {
      return res.status(400).json({ message: 'Invalid promotion ID' });
    }
    
    try {
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get the promotion
      const promotion = await db.query.promotions.findFirst({
        where: eq(promotions.id, promotionId)
      });
      
      if (!promotion) {
        return res.status(404).json({ message: 'Promotion not found' });
      }
      
      // Verify promotion is active
      if (!promotion.active) {
        return res.status(400).json({ message: 'Promotion is not active' });
      }
      
      // Verify promotion is available today
      if (!isPromotionAvailableToday(promotion)) {
        return res.status(400).json({ message: 'Promotion is not available today' });
      }
      
      // Check if user already has used this promotion today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingPromotion = await db.query.userPromotions.findFirst({
        where: and(
          eq(userPromotions.userId, user.id),
          eq(userPromotions.promotionId, promotionId),
          gte(userPromotions.activatedAt, today)
        )
      });
      
      if (existingPromotion) {
        return res.status(400).json({ message: 'You have already activated this promotion today' });
      }
      
      // Check if user already has any active promotion of this type
      const activePromotion = await db.query.userPromotions.findFirst({
        where: and(
          eq(userPromotions.userId, user.id),
          eq(userPromotions.status, 'active')
        ),
        with: {
          promotion: true
        }
      });
      
      if (activePromotion && activePromotion.promotion.bonusType === promotion.bonusType) {
        return res.status(400).json({ 
          message: `You already have an active ${promotion.bonusType} promotion` 
        });
      }
      
      // Create a new user promotion record
      const newUserPromotion = await db.insert(userPromotions)
        .values({
          userId: user.id,
          promotionId: promotionId,
          activatedAt: new Date(),
          status: 'active',
          wagered: 0
        })
        .returning();
      
      if (!newUserPromotion.length) {
        return res.status(500).json({ message: 'Failed to activate promotion' });
      }
      
      // If this is a deposit-related bonus, we'll need to apply it at deposit time
      // For now, just mark it as active
      
      res.status(200).json({
        message: 'Promotion activated successfully',
        userPromotion: newUserPromotion[0]
      });
    } catch (error: any) {
      console.error('Error activating promotion:', error);
      res.status(500).json({ message: error?.message || 'Failed to activate promotion' });
    }
  });
  
  // Cancel an active promotion
  app.post('/api/user/promotions/:id/cancel', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const userPromotionId = parseInt(req.params.id);
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (isNaN(userPromotionId)) {
      return res.status(400).json({ message: 'Invalid promotion ID' });
    }
    
    try {
      const user = await getUserByToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      
      // Get the user promotion with its associated promotion details
      const userPromotion = await db.query.userPromotions.findFirst({
        where: and(
          eq(userPromotions.id, userPromotionId),
          eq(userPromotions.userId, user.id)
        ),
        with: {
          promotion: true
        }
      });
      
      if (!userPromotion) {
        return res.status(404).json({ message: 'Promotion not found or not yours' });
      }
      
      // Check if promotion is already completed or cancelled
      if (userPromotion.status !== 'active') {
        return res.status(400).json({ message: `Promotion is already ${userPromotion.status}` });
      }
      
      // Get all transactions since the promotion was activated
      // These would be wins that need to be forfeited
      const promotionWins = await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id.toString()),
            eq(transactions.type, 'win'),
            gte(transactions.createdAt, userPromotion.createdAt)
          )
        );
      
      // Calculate total winnings during the bonus period
      let totalWinnings = 0;
      for (const win of promotionWins) {
        totalWinnings += parseFloat(win.amount.toString());
      }
      
      // Get bonus amount from the user promotion
      const bonusAmount = parseFloat(userPromotion.bonusAmount);
      
      // Calculate total amount to deduct (bonus + winnings)
      const amountToDeduct = bonusAmount + totalWinnings;
      console.log('Cancelling promotion:', { 
        bonusAmount, 
        totalWinnings, 
        amountToDeduct
      });
      
      // Update the promotion status to cancelled
      const updatedPromotion = await db.update(userPromotions)
        .set({ 
          status: 'cancelled',
          completedAt: new Date()
        })
        .where(eq(userPromotions.id, userPromotionId))
        .returning();
      
      if (!updatedPromotion.length) {
        return res.status(500).json({ message: 'Failed to cancel promotion' });
      }
      
      // Deduct bonus amount and any winnings from user's balance
      if (amountToDeduct > 0) {
        // Import balance controller to deduct funds
        const { balanceController } = await import('./controllers/balance');
        
        // Deduct the bonus amount and winnings (negative amount reduces balance)
        await balanceController.updateUserBalance(user.id, -amountToDeduct, 'bonus');
        
        // Record a transaction for this deduction
        await db.insert(transactions)
          .values({
            userId: user.id.toString(),
            type: 'bonus',
            amount: (-amountToDeduct).toString(),
            balanceBefore: '0', // This will be calculated in updateUserBalance
            balanceAfter: '0',  // This will be calculated in updateUserBalance
            createdAt: new Date()
          });
      }
      
      // Notify the client about the cancellation
      // Send current socket broadcast to update balance in real-time
      const io = req.app.get('socketio');
      if (io) {
        // Get updated balance
        const { getUserBalance } = await import('./storage');
        const userBalance = await getUserBalance();
        const totalBalance = userBalance ? parseFloat(userBalance.balance.toString()) : 0;
        
        // Get breakdown of balance components
        const balanceBreakdown = await balanceController.getBalanceBreakdown(user.id, totalBalance);
        
        console.log('After promotion cancellation, broadcasting balance update:');
        console.log('- Total balance:', totalBalance);
        console.log('- Balance breakdown:', JSON.stringify(balanceBreakdown));
        console.log('- Deducted amount:', amountToDeduct);
        
        // Use the helper function to broadcast balance update
        await broadcastBalanceUpdate(
          io,
          user.id,
          totalBalance,
          balanceBreakdown,
          'bonus',
          -amountToDeduct // Using negative value to indicate it's a deduction
        );
      }
      
      res.status(200).json({
        message: 'Promotion cancelled successfully. Bonus funds and associated winnings have been deducted.',
        userPromotion: updatedPromotion[0],
        deductedAmount: amountToDeduct
      });
    } catch (error: any) {
      console.error('Error cancelling promotion:', error);
      res.status(500).json({ message: error?.message || 'Failed to cancel promotion' });
    }
  });
  
  // Promotions endpoints
  
  // Get available promotions for the user
  app.get('/api/promotions/available', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Fetch active promotions from the database
      const activePromotions = await db.select()
        .from(promotions)
        .where(eq(promotions.active, true))
        .orderBy(asc(promotions.name));
        
      // Filter promotions that are available today
      const availablePromotions = activePromotions
        .filter(promo => isPromotionAvailableToday(promo))
        .map(promo => ({
          ...promo,
          // Convert any JSON fields to objects if they're stored as strings
          daysOfWeek: Array.isArray(promo.daysOfWeek) 
            ? promo.daysOfWeek 
            : JSON.parse(promo.daysOfWeek as unknown as string)
        }));
        
      res.status(200).json({ promotions: availablePromotions });
    } catch (error: any) {
      console.error('Available promotions error:', error);
      res.status(500).json({ message: error?.message || 'Failed to fetch promotions' });
    }
  });
  
  // Get active promotions for the current user
  app.get('/api/promotions/active', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Fetch active promotions for this user
      const activeUserPromotions = await db.select({
          id: userPromotions.id,
          userId: userPromotions.userId,
          promotionId: userPromotions.promotionId,
          depositId: userPromotions.depositId,
          bonusAmount: userPromotions.bonusAmount,
          turnoverRequirement: userPromotions.turnoverRequirement,
          wageringProgress: userPromotions.wageringProgress,
          status: userPromotions.status,
          completedAt: userPromotions.completedAt,
          createdAt: userPromotions.createdAt,
          updatedAt: userPromotions.updatedAt,
          // Include promotion details
          promotionName: promotions.name,
          promotionDescription: promotions.description,
          promotionBonusType: promotions.bonusType,
          promotionBonusValue: promotions.bonusValue,
          promotionImageUrl: promotions.imageUrl
        })
        .from(userPromotions)
        .innerJoin(promotions, eq(userPromotions.promotionId, promotions.id))
        .where(
          and(
            eq(userPromotions.userId, user.id),
            eq(userPromotions.status, 'active')
          )
        )
        .orderBy(desc(userPromotions.createdAt));
        
      res.status(200).json({ promotions: activeUserPromotions });
    } catch (error: any) {
      console.error('Active promotions error:', error);
      res.status(500).json({ message: error?.message || 'Failed to fetch active promotions' });
    }
  });
  
  // Activate a promotion
  app.post('/api/promotions/activate', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { promotionId, depositId, depositAmount } = req.body;
    
    if (!promotionId || !depositId || !depositAmount) {
      return res.status(400).json({ 
        message: 'Promotion ID, deposit ID, and deposit amount are required' 
      });
    }
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Fetch the promotion
      const [promotion] = await db.select()
        .from(promotions)
        .where(
          and(
            eq(promotions.id, promotionId),
            eq(promotions.active, true)
          )
        );
        
      if (!promotion) {
        return res.status(404).json({ message: 'Promotion not found or inactive' });
      }
      
      // Check if the promotion is available today
      if (!isPromotionAvailableToday(promotion)) {
        return res.status(400).json({ 
          message: 'This promotion is not available today' 
        });
      }
      
      // Check if the user has already used this promotion today
      const hasUsedPromotion = await hasUserUsedPromotionToday(user.id, promotionId);
      if (hasUsedPromotion) {
        return res.status(400).json({ 
          message: 'You have already used this promotion today' 
        });
      }
      
      // Check if deposit amount meets minimum requirement
      if (parseFloat(depositAmount) < parseFloat(promotion.minDeposit)) {
        return res.status(400).json({ 
          message: `Minimum deposit amount for this promotion is ${promotion.minDeposit}` 
        });
      }
      
      // Calculate bonus amount
      let bonusAmount = 0;
      if (promotion.bonusType === 'bonus') {
        // Percentage bonus
        bonusAmount = parseFloat(depositAmount) * (parseFloat(promotion.bonusValue) / 100);
        
        // Cap at max bonus if defined
        if (promotion.maxBonus && bonusAmount > parseFloat(promotion.maxBonus)) {
          bonusAmount = parseFloat(promotion.maxBonus);
        }
      } else if (promotion.bonusType === 'cashback') {
        // For cashback, we'd typically apply this after losses occur
        // For now, we'll just note the cashback percentage for future use
        bonusAmount = 0; // Will be calculated later when losses occur
      }
      
      // Calculate turnover requirement
      const turnoverRequirement = (parseFloat(depositAmount) + bonusAmount) * parseFloat(promotion.turnoverRequirement);
      
      // Create a user promotion record
      const [userPromotion] = await db.insert(userPromotions)
        .values({
          userId: user.id,
          promotionId: promotion.id,
          depositId: depositId,
          bonusAmount: bonusAmount.toString(),
          turnoverRequirement: turnoverRequirement.toString(),
          wageringProgress: "0",
          status: 'active'
        })
        .returning();
        
      // Update user balance with bonus amount if applicable
      if (bonusAmount > 0) {
        // Import the balance controller
        const { updateUserBalance } = await import('./controllers/balance');
        
        // Update balance with userId (1 is a placeholder - should be from auth)
        await updateUserBalance(1, bonusAmount, 'bonus');
      }
      
      res.status(201).json({
        message: 'Promotion activated successfully',
        userPromotion
      });
    } catch (error: any) {
      console.error('Activate promotion error:', error);
      res.status(500).json({ message: error?.message || 'Failed to activate promotion' });
    }
  });
  
  // Cancel an active promotion
  app.post('/api/promotions/cancel', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { userPromotionId } = req.body;
    
    if (!userPromotionId) {
      return res.status(400).json({ message: 'User promotion ID is required' });
    }
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Find the user promotion
      const [userPromotion] = await db.select()
        .from(userPromotions)
        .where(
          and(
            eq(userPromotions.id, userPromotionId),
            eq(userPromotions.userId, user.id),
            eq(userPromotions.status, 'active')
          )
        );
        
      if (!userPromotion) {
        return res.status(404).json({ 
          message: 'Active promotion not found or does not belong to you' 
        });
      }
      
      // Get all transactions since the promotion was activated
      // These would be wins that need to be forfeited
      const promotionWins = await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, user.id.toString()),
            eq(transactions.type, 'win'),
            gte(transactions.createdAt, userPromotion.createdAt)
          )
        );
      
      // Calculate total winnings during the bonus period
      let totalWinnings = 0;
      for (const win of promotionWins) {
        totalWinnings += parseFloat(win.amount.toString());
      }
      
      // Get bonus amount from the user promotion
      const bonusAmount = parseFloat(userPromotion.bonusAmount);
      
      // Calculate total amount to deduct (bonus + winnings)
      const amountToDeduct = bonusAmount + totalWinnings;
      console.log('Cancelling promotion:', { 
        bonusAmount, 
        totalWinnings, 
        amountToDeduct
      });
      
      // Update the user promotion status to cancelled
      const [updatedPromotion] = await db.update(userPromotions)
        .set({
          status: 'cancelled',
          completedAt: new Date()
        })
        .where(eq(userPromotions.id, userPromotionId))
        .returning();
        
      // If there was a bonus amount, we should deduct it from the user's balance
      if (amountToDeduct > 0) {
        // Import balance storage and controller functionality
        const { balanceController } = await import('./controllers/balance');
        
        // Deduct the bonus amount and any winnings (negative amount reduces balance)
        await balanceController.updateUserBalance(user.id, -amountToDeduct, 'bonus');
        
        // Record a transaction for this deduction
        await db.insert(transactions)
          .values({
            userId: user.id.toString(),
            type: 'bonus',
            amount: (-amountToDeduct).toString(),
            balanceBefore: '0', // This will be calculated in updateUserBalance
            balanceAfter: '0',  // This will be calculated in updateUserBalance
            createdAt: new Date()
          });
        
        // Notify the client about the cancellation via Socket.IO
        // Send current socket broadcast to update balance in real-time
        const io = req.app.get('socketio');
        if (io) {
          // Get updated balance
          const { getUserBalance } = await import('./storage');
          const userBalance = await getUserBalance();
          const totalBalance = userBalance ? parseFloat(userBalance.balance.toString()) : 0;
          
          // Get breakdown of balance components
          const balanceBreakdown = await balanceController.getBalanceBreakdown(user.id, totalBalance);
          
          // Use the helper function to broadcast balance update
          await broadcastBalanceUpdate(
            io, 
            user.id, 
            totalBalance, 
            balanceBreakdown, 
            'bonus', 
            amountToDeduct
          );
        }
      }
      
      res.status(200).json({
        message: 'Promotion cancelled successfully. Bonus funds and associated winnings have been deducted.',
        userPromotion: updatedPromotion,
        deductedAmount: amountToDeduct
      });
    } catch (error: any) {
      console.error('Cancel promotion error:', error);
      res.status(500).json({ message: error?.message || 'Failed to cancel promotion' });
    }
  });
  
  // Helper endpoint to update wagering progress (normally this would be automatic)
  app.post('/api/promotions/update-progress', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { userPromotionId, wagerAmount } = req.body;
    
    if (!userPromotionId || !wagerAmount) {
      return res.status(400).json({ 
        message: 'User promotion ID and wager amount are required' 
      });
    }
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      // Find the user promotion
      const [userPromotion] = await db.select()
        .from(userPromotions)
        .where(
          and(
            eq(userPromotions.id, userPromotionId),
            eq(userPromotions.userId, user.id),
            eq(userPromotions.status, 'active')
          )
        );
        
      if (!userPromotion) {
        return res.status(404).json({ 
          message: 'Active promotion not found or does not belong to you' 
        });
      }
      
      // Calculate new wagering progress
      const currentProgress = parseFloat(userPromotion.wageringProgress);
      const newProgress = currentProgress + parseFloat(wagerAmount);
      const turnoverRequirement = parseFloat(userPromotion.turnoverRequirement);
      
      // Check if wagering requirement is completed
      let status = 'active';
      let completedAt = null;
      
      if (newProgress >= turnoverRequirement) {
        status = 'completed';
        completedAt = new Date();
      }
      
      // Update the user promotion
      const [updatedPromotion] = await db.update(userPromotions)
        .set({
          wageringProgress: newProgress.toString(),
          status,
          completedAt
        })
        .where(eq(userPromotions.id, userPromotionId))
        .returning();
        
      res.status(200).json({
        message: status === 'completed' 
          ? 'Wagering requirement completed!' 
          : 'Wagering progress updated',
        userPromotion: updatedPromotion
      });
    } catch (error: any) {
      console.error('Update wagering progress error:', error);
      res.status(500).json({ 
        message: error?.message || 'Failed to update wagering progress' 
      });
    }
  });
  
  // Create a deposit with optional promotion
  app.post('/api/deposits', async (req: Request, res: Response) => {
    const token = req.headers.authorization?.split(' ')[1] || '';
    const { amount, method, promotionId } = req.body;
    
    console.log('Deposit request:', { amount, method, promotionId });
    
    if (!amount || !method) {
      return res.status(400).json({ message: 'Amount and method are required' });
    }
    
    try {
      // Get user from token
      const user = token ? await getUserByToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      console.log('Processing deposit for user:', user.id);
      
      // Verify the deposits table exists
      try {
        await db.select().from(deposits).limit(1);
      } catch (error) {
        console.error('Failed to query deposits table:', error);
        return res.status(500).json({ message: 'Database configuration issue with deposits table' });
      }
      
      // Create the deposit
      const [deposit] = await db.insert(deposits)
        .values({
          userId: user.id,
          amount: amount.toString(),
          method,
          status: 'completed', // Auto-complete for now
          promotionId: promotionId ? parseInt(promotionId) : null
        })
        .returning();
        
      // Update user balance
      const { updateUserBalance } = await import('./storage');
      let updatedBalance = await updateUserBalance(user.id, parseFloat(amount), 'deposit');
      
      // Get balance breakdown for more detailed balance information
      const { getBalanceBreakdown } = await import('./controllers/balance');
      const totalBalance = parseFloat(updatedBalance.balance.toString());
      
      // First balance breakdown might not have promotions included yet
      let balanceBreakdown = await getBalanceBreakdown(user.id, totalBalance);
      
      // If a promotion is being applied, the balance breakdown will be updated again later
      // and reflected in the final response
      
      // If a promotion was selected, activate it
      // Variable to track promotion data
      interface DepositWithPromotion {
        id: number;
        userId: number;
        amount: string;
        method: string;
        status: string;
        transactionId: string | null;
        promotionId: number | null;
        bonusAmount: string | null;
        createdAt: Date;
        updatedAt: Date;
        userPromotion: any;
      }
      
      let depositWithPromotion: DepositWithPromotion | undefined;
      
      if (promotionId) {
        try {
          console.log('Attempting to activate promotion ID:', promotionId);
          
          // Get promotion ID as a number
          const promotionIdNumber = parseInt(promotionId);
          
          // Prepare data for activation
          const depositId = deposit.id;
          const depositAmount = amount;
          
          // Fetch the promotion
          const [promotion] = await db.select()
            .from(promotions)
            .where(
              and(
                eq(promotions.id, promotionIdNumber),
                eq(promotions.active, true)
              )
            );
            
          if (!promotion) {
            console.log('Promotion not found or inactive:', promotionIdNumber);
            // Just log the error, but continue with the deposit
            return res.status(201).json({
              message: 'Deposit successful, but promotion was not found or inactive',
              deposit,
              balance: updatedBalance.balance
            });
          }
          
          console.log('Found promotion:', promotion.name);
          
          // Check if the promotion is available today
          if (!isPromotionAvailableToday(promotion)) {
            console.log('Promotion not available today:', promotion.name);
            // Just log the error, but continue with the deposit
            return res.status(201).json({
              message: 'Deposit successful, but the selected promotion is not available today',
              deposit,
              balance: updatedBalance.balance
            });
          }
          
          // Check if the user has already used this promotion today
          const hasUsedPromotion = await hasUserUsedPromotionToday(user.id, promotionIdNumber);
          if (hasUsedPromotion) {
            console.log('User already used this promotion today');
            // Just log the error, but continue with the deposit
            return res.status(201).json({
              message: 'Deposit successful, but you have already used this promotion today',
              deposit,
              balance: updatedBalance.balance
            });
          }
          
          // Check if deposit amount meets minimum requirement
          if (parseFloat(depositAmount) < parseFloat(promotion.minDeposit)) {
            console.log('Deposit amount does not meet minimum requirement:', {
              depositAmount,
              minRequired: promotion.minDeposit
            });
            // Just log the error, but continue with the deposit
            return res.status(201).json({
              message: `Deposit successful, but minimum deposit amount for the promotion is ${promotion.minDeposit}`,
              deposit,
              balance: updatedBalance.balance
            });
          }
          
          // Calculate bonus amount
          let bonusAmount = 0;
          if (promotion.bonusType === 'bonus') {
            // Percentage bonus
            bonusAmount = parseFloat(depositAmount) * (parseFloat(promotion.bonusValue) / 100);
            
            // Cap at max bonus if defined
            if (promotion.maxBonus && bonusAmount > parseFloat(promotion.maxBonus)) {
              bonusAmount = parseFloat(promotion.maxBonus);
            }
            
            console.log('Calculated bonus amount:', bonusAmount);
          } else if (promotion.bonusType === 'cashback') {
            // For cashback, we'd typically apply this after losses occur
            // For now, we'll just note the cashback percentage for future use
            bonusAmount = 0; // Will be calculated later when losses occur
          }
          
          // Calculate turnover requirement
          const turnoverRequirement = (parseFloat(depositAmount) + bonusAmount) * parseFloat(promotion.turnoverRequirement);
          console.log('Calculated turnover requirement:', turnoverRequirement);
          
          // Create a user promotion record
          const [userPromotion] = await db.insert(userPromotions)
            .values({
              userId: user.id,
              promotionId: promotion.id,
              depositId: deposit.id,
              bonusAmount: bonusAmount.toString(),
              turnoverRequirement: turnoverRequirement.toString(),
              wageringProgress: "0",
              status: 'active'
            })
            .returning();
            
          console.log('Created user promotion record:', userPromotion.id);
            
          // Update user balance with bonus amount if applicable
          if (bonusAmount > 0) {
            // Update balance with bonus amount
            const bonusBalanceUpdate = await updateUserBalance(user.id, bonusAmount, 'bonus');
            
            // Get updated balance breakdown with bonus included
            const bonusBalance = parseFloat(bonusBalanceUpdate.balance.toString());
            const bonusBalanceBreakdown = await getBalanceBreakdown(user.id, bonusBalance);
            
            // Use standardized helper function to broadcast bonus update
            await broadcastBalanceUpdate(
              io,
              user.id,
              bonusBalance,
              bonusBalanceBreakdown,
              'bonus',
              bonusAmount
            );
            
            // Update the reference for the response with the latest balance
            updatedBalance = bonusBalanceUpdate;
            console.log('Applied bonus to balance:', bonusAmount, 'Updated breakdown:', bonusBalanceBreakdown);
          }
          
          // Include the activated promotion in the response
          // Create a new object with the deposit and promotion info
          depositWithPromotion = {
            id: deposit.id,
            userId: deposit.userId,
            amount: deposit.amount,
            method: deposit.method,
            status: deposit.status,
            transactionId: deposit.transactionId,
            promotionId: deposit.promotionId,
            bonusAmount: deposit.bonusAmount,
            createdAt: deposit.createdAt,
            updatedAt: deposit.updatedAt,
            userPromotion: userPromotion
          };
          
        } catch (promoError: any) {
          console.error('Failed to activate promotion:', promoError);
          // Continue with the deposit even if promotion activation fails
        }
      }
      
      // Check if a promotion was applied
      let responseDeposit = deposit;
      
      if (promotionId && typeof depositWithPromotion !== 'undefined') {
        responseDeposit = depositWithPromotion;
        console.log('Using deposit with promotion in response');
      }
      
      // Get final balance breakdown after all operations are complete
      // This is important because the promotion might have been added after the initial balance update
      const finalBalance = parseFloat(updatedBalance.balance.toString());
      const finalBalanceBreakdown = await getBalanceBreakdown(user.id, finalBalance);
      
      // Broadcast final balance update with complete information
      await broadcastBalanceUpdate(
        io,
        user.id,
        finalBalance,
        finalBalanceBreakdown,
        'deposit',
        parseFloat(amount)
      );
      
      res.status(201).json({
        message: 'Deposit successful',
        deposit: responseDeposit,
        balance: {
          total: finalBalance,
          ...finalBalanceBreakdown
        }
      });
    } catch (error: any) {
      console.error('Deposit error:', error);
      res.status(500).json({ message: error?.message || 'Failed to process deposit' });
    }
  });
  
  // Register admin routes
  registerAdminRoutes(app);
  
  return httpServer;
}
