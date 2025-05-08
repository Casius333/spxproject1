import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { gamesController } from "./controllers/games";
import { balanceController } from "./controllers/balance";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
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
