import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gamesController } from "./controllers/games";
import { balanceController } from "./controllers/balance";
import { registerUser, loginUser, logoutUser, getUserByToken, authenticate, verifyOtp } from "./auth-service";

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
