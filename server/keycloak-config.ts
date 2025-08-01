import { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import expressSession from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db';

// Add Bearer token validation function for public clients
async function validateBearerToken(token: string, keycloakConfig: any): Promise<any> {
  try {
    // Use userinfo endpoint for public clients instead of token introspection
    // Ensure proper URL construction by removing trailing slash and adding one
    const baseUrl = keycloakConfig['auth-server-url'].replace(/\/+$/, '');
    const userinfoUrl = `${baseUrl}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;

    console.log('[VALIDATE_BEARER_TOKEN] Using userinfo endpoint:', userinfoUrl);
    console.log('[VALIDATE_BEARER_TOKEN] Token length:', token.length);

    const response = await fetch(userinfoUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[VALIDATE_BEARER_TOKEN] Response status:', response.status);
    console.log('[VALIDATE_BEARER_TOKEN] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const responseText = await response.text();
      console.error('[VALIDATE_BEARER_TOKEN] Response not ok:', response.status, responseText);
      throw new Error(`Token validation failed: ${response.status} - ${responseText}`);
    }

    const result = await response.json() as any;
    console.log('[VALIDATE_BEARER_TOKEN] Userinfo result:', result);

    // Add active flag to match expected format
    return result ? { ...result, active: true } : null;
  } catch (error) {
    console.error('[VALIDATE_BEARER_TOKEN] Bearer token validation error:', error);
    return null;
  }
}

/**
 * Initialize Keycloak authentication in the Express app
 * @param app Express application instance
 * @returns Keycloak instance
 */
export async function initKeycloak(app: Express) {
  // Import keycloak-connect - it's a CommonJS module
  let Keycloak;
  try {
    const keycloakModule = await import('keycloak-connect');
    // keycloak-connect exports the constructor directly
    Keycloak = (keycloakModule as any).default || keycloakModule;
  } catch (error) {
    console.error('Failed to import keycloak-connect:', error);
    return null;
  }
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

    // Override the auth-server-url for server-side communication
    // The server needs to use the internal Docker network URL
    const serverKeycloakConfig = { ...keycloakConfig };

    // Determine the internal Keycloak URL based on environment
    const keycloakServiceName = process.env.KEYCLOAK_SERVICE_NAME || 'keycloak';
    const keycloakServicePort = process.env.KEYCLOAK_SERVICE_PORT || '8080';
    const internalKeycloakUrl = `http://${keycloakServiceName}:${keycloakServicePort}/`;

    // Use internal URL for server-to-server communication
    serverKeycloakConfig["auth-server-url"] = internalKeycloakUrl;

    console.log(`Using external Keycloak URL for browsers: ${keycloakConfig["auth-server-url"]}`);
    console.log(`Using internal Keycloak URL for server: ${serverKeycloakConfig["auth-server-url"]}`);

    // Additional configuration for reliability
    serverKeycloakConfig["enable-cors"] = true;
    serverKeycloakConfig["ssl-required"] = "none";
    serverKeycloakConfig["verify-token-audience"] = false;
    serverKeycloakConfig["use-resource-role-mappings"] = true;
    serverKeycloakConfig["confidential-port"] = 0;
    serverKeycloakConfig["bearer-only"] = true; // Enable Bearer token support

    // Initialize Keycloak with PostgreSQL session store
    console.log('Initializing Keycloak instance...');

    // Check if Keycloak constructor is available
    if (typeof Keycloak !== 'function') {
      throw new Error('Keycloak constructor not found');
    }

    const keycloak = new Keycloak(
      { store: sessionStore },
      serverKeycloakConfig
    );

    // Verify keycloak instance was created
    if (!keycloak) {
      throw new Error('Failed to create Keycloak instance');
    }

    // Initialize Keycloak middleware for session-based authentication
    console.log('Registering Keycloak middleware for session-based authentication...');

    // Apply Keycloak middleware
    app.use(keycloak.middleware({
      logout: '/logout',
      admin: '/'
    }));

    console.log('Keycloak middleware registration completed successfully');

    // Store both configs - external for token validation, internal for server communication
    (keycloak as any)._serverKeycloakConfig = serverKeycloakConfig;
    (keycloak as any)._externalKeycloakConfig = keycloakConfig;

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
 * Get authentication middleware for protecting routes
 * @param keycloak Keycloak instance
 * @returns middleware function or passthrough
 */
export function getAuthMiddleware(keycloak: any) {
  if (!keycloak) {
    return (req: any, res: any, next: any) => {
      console.warn(`Auth warning: Unprotected access to ${req.method} ${req.path}`);
      next();
    };
  }

  // Custom middleware that handles Bearer token authentication only
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        console.log('Attempting Bearer token validation...');

        const tokenInfo = await validateBearerToken(token, (keycloak as any)._externalKeycloakConfig);
        if (tokenInfo) {
          console.log('Bearer token validated successfully');

          // Create user info object from token
          const userInfo = {
            id: tokenInfo.sub,
            username: tokenInfo.preferred_username,
            email: tokenInfo.email,
            name: tokenInfo.name || tokenInfo.preferred_username,
            roles: tokenInfo.realm_access?.roles || []
          };

          // Add user info to request
          (req as any).user = userInfo;

          // Import storage here to avoid circular dependency
          const { storage } = await import('./storage');

          // Handle user creation/mapping for Bearer token authenticated users
          try {
            const keycloakId = userInfo.id;
            const username = userInfo.username;

            // Check if the user exists in our database
            const dbUser = await storage.getUserByKeycloakId(keycloakId);

            if (!dbUser) {
              console.log(`Creating new user record for Keycloak user: ${username} (${keycloakId})`);

              // Create a new user record in our database
              const newUser = await storage.createUser({
                keycloak_id: keycloakId,
                username,
                name: userInfo.name || null,
                email: userInfo.email || null
              });

              if (newUser) {
                console.log(`Successfully created user record with ID: ${newUser.id}`);
                (req as any).user.dbId = newUser.id;
              }
            } else {
              console.log(`Found existing user record for Keycloak user: ${username}`);
              (req as any).user.dbId = dbUser.id;
            }
          } catch (error) {
            console.error("Error handling Bearer token user creation:", error);
            // Continue without database user ID - the API can still function
          }

          return next();
        } else {
          console.log('Bearer token validation failed');
          return res.status(401).json({ error: 'Invalid Bearer token' });
        }
      }

      // No Bearer token found - reject the request
      console.log('No Bearer token found, authentication required');
      return res.status(401).json({ error: 'Authentication required - Bearer token missing' });
    } catch (error) {
      console.error('Authentication middleware error:', error);
      res.status(500).json({ error: 'Authentication error' });
    }
  };
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