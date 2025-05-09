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
      
      const user = await registerUser(email, password);
      res.status(201).json(user);
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
  
  // Protected route middleware
  app.use('/api/protected', authenticate);
  
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
