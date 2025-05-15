import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { Pool } from '@neondatabase/serverless';
import connectPg from 'connect-pg-simple';
import { storage } from './storage';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

// Add user property to session
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: number;
      username: string;
      name?: string | null;
      email?: string | null;
      roles: string[];
    };
  }
}

// Session store setup
export function setupSessionStore(pool: Pool) {
  const PostgresSessionStore = connectPg(session);
  
  return new PostgresSessionStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true
  });
}

// Password hashing function
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256');
  hash.update(password + salt);
  return hash.digest('hex') + '.' + salt;
}

// Password verification function
function verifyPassword(password: string, hashedPassword: string): boolean {
  const [storedHash, salt] = hashedPassword.split('.');
  const hash = createHash('sha256');
  hash.update(password + salt);
  const calculatedHash = hash.digest('hex');
  return calculatedHash === storedHash;
}

export function setupAuth(app: Express, sessionStore: session.Store) {
  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'ospo-app-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post('/api/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    try {
      // For demo purposes, handle legacy/keycloak-linked users
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      // Store user in session (for demo purposes without password verification)
      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        roles: [user.role || 'user']
      };
      
      return res.status(200).json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Authentication failed' });
    }
  });
  
  app.post('/api/register', async (req: Request, res: Response) => {
    const { username, email, name } = req.body;
    
    if (!username || !email) {
      return res.status(400).json({ message: 'Username and email are required' });
    }
    
    try {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }
      
      // Create a random keycloakId for compatibility with existing schema
      const randomKeycloakId = randomBytes(16).toString('hex');
      
      // Create new user
      const newUser = await storage.createUser({
        keycloakId: randomKeycloakId,
        username,
        name: name || null,
        email
      });
      
      // Store user in session
      req.session.user = {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        roles: [newUser.role || 'user']
      };
      
      return res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: 'Registration failed' });
    }
  });
  
  app.post('/api/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: 'Logout successful' });
    });
  });
  
  app.get('/api/user', (req: Request, res: Response) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    return res.status(200).json(req.session.user);
  });
}

// Middleware to check if user is authenticated
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    return next();
  }
  
  res.status(401).json({ message: 'Authentication required' });
}

// Middleware to check if user has required role
export function hasRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const userRoles = req.session.user.roles || [];
    
    if (userRoles.includes(role) || userRoles.includes('admin')) {
      return next();
    }
    
    res.status(403).json({ message: 'Insufficient permissions' });
  };
}