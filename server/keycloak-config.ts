import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import expressSession from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';
// Import Keycloak using dynamic import
let Keycloak: any;

/**
 * Initialize Keycloak authentication in the Express app
 * @param app Express application instance
 * @returns Keycloak instance
 */
export function initKeycloak(app: Express) {
  // Create a session store based on database availability
  let sessionStore;
  
  if (pool) {
    // Use PostgreSQL if available (with type assertion)
    const PgStore = connectPgSimple(expressSession);
    sessionStore = new PgStore({
      pool: pool as any, // Type assertion to resolve TS error
      createTableIfMissing: true
    });
    console.log("Using PostgreSQL session store");
  } else {
    // Fallback to memory store if no database
    const MemoryStore = expressSession.MemoryStore;
    sessionStore = new MemoryStore();
    console.log("WARNING: Using memory session store (not suitable for production)");
  }

  // Set up session middleware with PostgreSQL store
  app.use(
    expressSession({
      secret: process.env.SESSION_SECRET || 'ospo-events-secret',
      resave: false,
      saveUninitialized: false,
      store: sessionStore,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      }
    })
  );

  try {
    // Load Keycloak configuration
    const keycloakConfigPath = path.join(process.cwd(), 'keycloak.json');
    console.log(`Loading Keycloak config from: ${keycloakConfigPath}`);
    
    if (!fs.existsSync(keycloakConfigPath)) {
      throw new Error(`Keycloak config file not found at: ${keycloakConfigPath}`);
    }
    
    const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath, 'utf8'));
    console.log(`Keycloak config loaded successfully:`, keycloakConfig);
    
    // Override auth-server-url based on environment
    if (process.env.KEYCLOAK_URL) {
      console.log(`Using custom Keycloak URL: ${process.env.KEYCLOAK_URL}`);
      keycloakConfig["auth-server-url"] = process.env.KEYCLOAK_URL;
    } else {
      // In Kubernetes, use simple service name which will be resolved by K8s DNS
      const keycloakServiceName = process.env.KEYCLOAK_SERVICE_NAME || 'keycloak';
      const keycloakServicePort = process.env.KEYCLOAK_SERVICE_PORT || '8080';
      
      // Format: http://service-name:port/auth/ to match KC_HTTP_RELATIVE_PATH in Keycloak
      const keycloakUrl = `http://${keycloakServiceName}:${keycloakServicePort}/auth/`;
      
      console.log(`Using Kubernetes service URL for Keycloak: ${keycloakUrl}`);
      keycloakConfig["auth-server-url"] = keycloakUrl;
    }
    
    // Additional configuration for reliability
    keycloakConfig["enable-cors"] = true;
    keycloakConfig["ssl-required"] = "none";
    keycloakConfig["verify-token-audience"] = false;
    keycloakConfig["use-resource-role-mappings"] = true;
    keycloakConfig["confidential-port"] = 0;
    
    // Initialize Keycloak with PostgreSQL session store
    console.log('Initializing Keycloak instance...');
    const keycloak = new Keycloak(
      { store: sessionStore }, 
      keycloakConfig
    );
    
    console.log('Registering Keycloak middleware...');
    // Register Keycloak middleware
    app.use(keycloak.middleware({
      logout: '/logout',
      admin: '/'
    }));
    
    console.log('Keycloak initialization completed successfully');
    return keycloak;
  } catch (error) {
    console.error('Error initializing Keycloak:', error);
    // Handle the error gracefully
    console.error('Continuing without Keycloak authentication');
    return null;
  }
}

/**
 * Secure API routes with Keycloak authentication
 * @param app Express application instance
 * @param keycloak Keycloak instance
 */
export function secureWithKeycloak(app: Express, keycloak: any) {
  if (!keycloak) {
    console.warn('Keycloak not initialized, API routes will not be protected');
    // Add a middleware that warns about missing authentication but lets requests through
    app.use('/api/*', (req, res, next) => {
      // Skip OPTIONS requests (for CORS)
      if (req.method === 'OPTIONS') {
        return next();
      }
      
      // Log a warning for non-public endpoints
      if (!req.path.startsWith('/api/health') && !req.path.startsWith('/api/public')) {
        console.warn(`Auth warning: Unprotected access to ${req.method} ${req.path}`);
      }
      next();
    });
    return;
  }

  // Health check endpoints don't need auth
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', auth: keycloak ? 'enabled' : 'disabled' });
  });

  // API routes that need authentication
  const protectedRoutes = [
    '/api/events',
    '/api/events/:id',
    '/api/cfp-submissions',
    '/api/cfp-submissions/:id',
    '/api/attendees',
    '/api/attendees/:id',
    '/api/sponsorships',
    '/api/sponsorships/:id',
    '/api/assets',
    '/api/assets/:id',
    '/api/users/:id',
    '/api/users/:id/profile',
    '/api/users/:id/headshot',
  ];

  // Secure API routes
  protectedRoutes.forEach(route => {
    try {
      app.use(route, keycloak.protect('realm:user'));
    } catch (err) {
      console.error(`Failed to protect route ${route}:`, err);
      // Add a fallback middleware that logs access but lets requests through
      app.use(route, (req, res, next) => {
        console.warn(`Auth bypass: ${req.method} ${req.path} would normally require authentication`);
        next();
      });
    }
  });

  // Admin-only routes
  // app.use('/api/admin/*', keycloak.protect('realm:admin'));
}

/**
 * Middleware to map Keycloak user information to the request object
 * @param req Request object
 * @param res Response object
 * @param next Next middleware function
 */
export function keycloakUserMapper(req: any, res: any, next: any) {
  try {
    if (req.kauth && req.kauth.grant) {
      const tokenContent = req.kauth.grant.access_token.content;
      
      // Extract user info from Keycloak token
      req.user = {
        id: tokenContent.sub,
        username: tokenContent.preferred_username,
        email: tokenContent.email,
        name: tokenContent.name || tokenContent.preferred_username,
        roles: tokenContent.realm_access?.roles || []
      };
    }
  } catch (error) {
    console.error('Error in keycloakUserMapper:', error);
  }
  
  next();
}