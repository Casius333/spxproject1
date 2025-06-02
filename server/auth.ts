import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from 'bcryptjs';
import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "@db";
import { config } from './config';
import { authLimiter } from './middleware/security';
import { 
  registerValidation, 
  loginValidation, 
  handleValidationErrors 
} from './middleware/validation';
import { AppError, asyncHandler } from './middleware/errorHandler';
import { progressiveRateLimit, resetLoginStrikes } from './middleware/progressiveRateLimit';

// Extend Express.User interface
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      email: string;
      // Removed role from interface
    }
  }
}

const SALT_ROUNDS = 12;

// Password hashing and verification functions using bcrypt
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  supplied: string,
  stored: string
): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

// Setup PostgreSQL session store
const PostgresSessionStore = connectPg(session);

// Configure and initialize authentication
export function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET || "casino-slots-secret-key";

  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
    },
    store: new PostgresSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for authentication
  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await db.query.users.findFirst({
          where: eq(users.email, email),
        });

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // User successfully authenticated
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize user for session storage
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        return done(null, false);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  // Registration endpoint
  app.post("/api/register", 
    progressiveRateLimit,
    registerValidation,
    handleValidationErrors,
    async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          message: "Email and password are required",
        });
      }
      
      // Generate username from email
      const username = email.split('@')[0] + Math.floor(Math.random() * 10000);

      // Check if email already exists
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          // Removed role and status if columns don't exist in DB
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          // Removed role from returned data
        });

      // Auto-login after registration
      // Add a type assertion to satisfy TypeScript
      req.login(newUser as Express.User, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to login after registration" });
        }
        return res.status(201).json(newUser);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error, user: Express.User, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.status(200).json(req.user);
  });

  // Middleware to check if user is authenticated
  app.use("/api/protected", (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  });

  // Create or update a session table if it doesn't exist
  createSessionTable().catch(console.error);
}

// Create session table if it doesn't exist
async function createSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);
    console.log("Session table initialized");
  } catch (error) {
    console.error("Failed to create session table:", error);
  }
}