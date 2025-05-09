import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gamesController } from "./controllers/games";
import { balanceController } from "./controllers/balance";
import { registerUser, loginUser, logoutUser, getUserByToken, authenticate } from "./auth-service";
import { supabase } from "../lib/supabase";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup JWT authentication routes
  
  // Register endpoint
  app.post('/api/register', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // First register with Supabase Auth
      const supabaseUser = await registerUser(email, password);
      
      // Then manually create a user in our database using direct query
      // This is a fallback to ensure users are created in our database
      try {
        // Generate username from email (username@example.com -> username1234)
        const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
        const tempPassword = Math.random().toString(36).slice(-10);
        
        const { pool } = require('../db');
        
        // Check if user already exists first
        const existingResult = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        
        if (existingResult.rows && existingResult.rows.length > 0) {
          console.log(`User ${email} already exists in database`);
        } else {
          // Create user if doesn't exist
          const result = await pool.query(
            'INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, email, tempPassword, new Date(), new Date()]
          );
          
          if (result.rows && result.rows[0]) {
            console.log(`Created database user for ${email} directly in routes`);
          }
        }
      } catch (dbError) {
        console.error('Database user creation error (ignorable):', dbError);
        // We continue anyway since auth is handled by Supabase
      }
      
      res.status(201).json(supabaseUser);
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ message: error?.message || 'Failed to register' });
    }
  });
  
  // Login endpoint
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }
      
      // First attempt to login with Supabase Auth
      const data = await loginUser(email, password);
      
      // Then check if user exists in our database, create if not
      try {
        const { pool } = require('../db');
        
        // Check if user exists
        const existingResult = await pool.query(
          'SELECT * FROM users WHERE email = $1',
          [email]
        );
        
        if (existingResult.rows && existingResult.rows.length > 0) {
          // User exists - update last login time
          await pool.query(
            'UPDATE users SET updated_at = $1 WHERE email = $2',
            [new Date(), email]
          );
          console.log(`Updated last login time for ${email}`);
        } else {
          // User doesn't exist in our database - create them
          const username = email.split('@')[0] + Math.floor(Math.random() * 10000);
          const tempPassword = Math.random().toString(36).slice(-10);
          
          const result = await pool.query(
            'INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, email, tempPassword, new Date(), new Date()]
          );
          
          if (result.rows && result.rows[0]) {
            console.log(`Created database user for ${email} during login`);
          }
        }
      } catch (dbError) {
        console.error('Database user check/creation error during login (ignorable):', dbError);
        // We continue anyway since auth is handled by Supabase
      }
      
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
  
  // Protected route middleware
  app.use('/api/protected', authenticate);
  
  // Auth callback route for handling Supabase email confirmations and redirects
  app.get('/auth/callback', (req: Request, res: Response) => {
    // This route captures all Supabase redirects from email confirmations
    // Just redirect to the main page, and the frontend will handle the tokens
    res.redirect('/');
  });
  
  // Test endpoint to verify Supabase connection
  app.get('/api/supabase-test', async (req: Request, res: Response) => {
    try {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        return res.status(500).json({ 
          message: 'Error fetching auth users', 
          error: authError.message 
        });
      }
      
      // Count users with emails matching what we're looking for
      const testUsers = authUsers.users.filter(user => 
        user.email?.includes('test') || user.email?.includes('example')
      );
      
      return res.status(200).json({ 
        message: 'Supabase connection successful',
        totalAuthUsers: authUsers.users.length,
        testUsersCount: testUsers.length
      });
    } catch (error: any) {
      console.error('Supabase test error:', error);
      return res.status(500).json({ 
        message: 'Error testing Supabase connection', 
        error: error?.message || 'Unknown error' 
      });
    }
  });
  
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection status tracking
  const clientStatus = new Map<WebSocket, boolean>();
  
  // WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    // Mark the client as alive
    clientStatus.set(ws, true);
    
    // Handle pings for connection keep-alive
    ws.on('pong', () => {
      clientStatus.set(ws, true);
    });
    
    console.log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to SpinVerse WebSocket server'
    }));
    
    // Handle incoming messages
    ws.on('message', (message: any) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        switch (data.type) {
          case 'win':
            // Broadcast win notifications to all clients except sender
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'win_notification',
                  amount: data.amount,
                  username: data.username || 'Anonymous',
                  game: data.game || 'Slots'
                }));
              }
            });
            break;
            
          case 'jackpot':
            // Broadcast jackpot win to everyone
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'jackpot_notification',
                  amount: data.amount,
                  username: data.username || 'Anonymous',
                  game: data.game || 'Slots'
                }));
              }
            });
            break;
            
          case 'ping':
            // Send pong response only to the sender
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
            
          default:
            // Broadcast generic messages to all except sender
            wss.clients.forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
              }
            });
        }
      } catch (error) {
        console.error('Invalid WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      // Remove from status tracking on disconnect
      clientStatus.delete(ws);
      console.log('WebSocket client disconnected');
    });
    
    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Set up a heartbeat interval to check for stale connections
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (clientStatus.get(ws) === false) {
        clientStatus.delete(ws);
        return ws.terminate();
      }
      
      clientStatus.set(ws, false);
      ws.ping();
    });
  }, 30000); // Check every 30 seconds
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  // Game routes
  app.get('/api/games', gamesController.getAllGames);
  app.get('/api/games/:id', gamesController.getGameById);
  app.get('/api/games/category/:categoryId', gamesController.getGamesByCategory);
  app.get('/api/categories', gamesController.getAllCategories);
  app.get('/api/search', gamesController.searchGames);
  
  // Featured collections
  app.get('/api/featured', gamesController.getFeaturedGames);
  app.get('/api/jackpots', gamesController.getJackpotGames);
  app.get('/api/popular', gamesController.getPopularGames);
  app.get('/api/new', gamesController.getNewGames);
  
  // Balance routes
  app.get('/api/balance', balanceController.getBalance);
  app.post('/api/balance', balanceController.updateBalance);
  app.get('/api/transactions', balanceController.getTransactions);
  
  return httpServer;
}
