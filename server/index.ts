import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { registerAdminRoutes } from './admin-routes';
import { setupAuth } from './auth';
import { config } from './config';
import { logger, morganStream } from './utils/logger';
import { 
  corsMiddleware, 
  helmetMiddleware, 
  generalLimiter, 
  securityHeaders, 
  ipLogger 
} from './middleware/security';
import { 
  errorHandler, 
  notFoundHandler, 
  handleUncaughtException, 
  handleUnhandledRejection 
} from './middleware/errorHandler';
import { sanitizeInput } from './middleware/validation';
import morgan from 'morgan';

// Set up global error handlers
process.on('uncaughtException', handleUncaughtException);
process.on('unhandledRejection', handleUnhandledRejection);

const app = express();

// Security middleware (applied first)
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(securityHeaders);
app.use(ipLogger);

// Rate limiting
app.use(generalLimiter);

// Body parsing with limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    if (buf.length > 10 * 1024 * 1024) {
      throw new Error('Payload too large');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// HTTP request logging
if (config.SERVER.IS_PRODUCTION) {
  app.use(morgan('combined', { stream: morganStream }));
} else {
  app.use(morgan('dev', { stream: morganStream }));
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Set up authentication
  setupAuth(app);
  
  // Register routes
  const server = await registerRoutes(app);
  registerAdminRoutes(app);

  // 404 handler (before error handler)
  app.use(notFoundHandler);

  // Global error handling middleware (must be last)
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (config.SERVER.IS_DEVELOPMENT) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use the port from our config
  const port = config.SERVER.PORT;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server running on port ${port} in ${config.SERVER.IS_PRODUCTION ? 'production' : 'development'} mode`);
  });
})();
