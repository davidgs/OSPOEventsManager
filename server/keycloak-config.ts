import { Express } from 'express';
import path from 'path';
import fs from 'fs';
import expressSession from 'express-session';
// Import as dynamic import
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Keycloak = require('keycloak-connect');

// Create memory store for sessions
const memoryStore = new expressSession.MemoryStore();

/**
 * Initialize Keycloak authentication in the Express app
 * @param app Express application instance
 * @returns Keycloak instance
 */
export function initKeycloak(app: Express) {
  // Set up session middleware
  app.use(
    expressSession({
      secret: 'ospo-events-secret',
      resave: false,
      saveUninitialized: true,
      store: memoryStore,
    })
  );

  try {
    // Load Keycloak configuration
    const keycloakConfigPath = path.join(process.cwd(), 'keycloak.json');
    const keycloakConfig = JSON.parse(fs.readFileSync(keycloakConfigPath, 'utf8'));

    // Initialize Keycloak
    const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
    
    // Register Keycloak middleware
    app.use(keycloak.middleware());
    
    return keycloak;
  } catch (error) {
    console.error('Error initializing Keycloak:', error);
    // Return a mock Keycloak instance for development
    return {
      middleware: () => (req: any, res: any, next: any) => next(),
      protect: () => (req: any, res: any, next: any) => next()
    };
  }
}

/**
 * Secure API routes with Keycloak authentication
 * @param app Express application instance
 * @param keycloak Keycloak instance
 */
export function secureWithKeycloak(app: Express, keycloak: any) {
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
    app.use(route, keycloak.protect('realm:user'));
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