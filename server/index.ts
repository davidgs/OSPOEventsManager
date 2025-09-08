import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";
import { initKeycloak, getAuthMiddleware, keycloakUserMapper } from "./keycloak-config";
import { initializeDatabase } from "./init-db";
import { createProxyMiddleware } from 'http-proxy-middleware';
import fileUpload from "express-fileupload";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Production-safe logging function
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

const app = express();

// Trust proxy - TEMPORARILY DISABLED for debugging
// app.set('trust proxy', 1);

// Security middleware
const keycloakUrl = process.env.KEYCLOAK_CLIENT_URL || process.env.VITE_KEYCLOAK_URL || "https://keycloak-prod-rh-events-org.apps.ospo-osci.z3b1.p1.openshiftapps.com";
// Extract base URL (without /auth) for CSP - Keycloak needs both base URL and /auth path
const keycloakBaseUrl = keycloakUrl.replace(/\/auth$/, '');
console.log(`🔐 CSP Keycloak URL: ${keycloakUrl}`);
console.log(`🔐 CSP Keycloak Base URL: ${keycloakBaseUrl}`);
console.log(`🔐 KEYCLOAK_CLIENT_URL: ${process.env.KEYCLOAK_CLIENT_URL}`);
console.log(`🔐 VITE_KEYCLOAK_URL: ${process.env.VITE_KEYCLOAK_URL}`);
const additionalConnectSrc = process.env.CSP_CONNECT_SRC ? process.env.CSP_CONNECT_SRC.split(',') : [];
const additionalFrameSrc = process.env.CSP_FRAME_SRC ? process.env.CSP_FRAME_SRC.split(',') : [];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", ...(process.env.CSP_STYLE_SRC || "https://fonts.googleapis.com").split(',')],
      scriptSrc: ["'self'", ...(process.env.CSP_SCRIPT_SRC || "").split(',').filter(Boolean)],
      imgSrc: ["'self'", "data:", "https:", ...(process.env.CSP_IMG_SRC || "").split(',').filter(Boolean)],
      connectSrc: ["'self'", keycloakUrl, keycloakBaseUrl, ...additionalConnectSrc],
      fontSrc: ["'self'", ...(process.env.CSP_FONT_SRC || "https://fonts.gstatic.com").split(',')],
      objectSrc: [process.env.CSP_OBJECT_SRC || "none"],
      mediaSrc: ["'self'", ...(process.env.CSP_MEDIA_SRC || "").split(',').filter(Boolean)],
      frameSrc: ["'self'", keycloakUrl, keycloakBaseUrl, ...additionalFrameSrc],
    },
  },
  crossOriginEmbedderPolicy: process.env.HELMET_COEP !== 'true',
  hsts: {
    maxAge: parseInt(process.env.HELMET_HSTS_MAX_AGE || '31536000'),
    includeSubDomains: process.env.HELMET_HSTS_INCLUDE_SUBDOMAINS !== 'false',
    preload: process.env.HELMET_HSTS_PRELOAD !== 'false'
  }
}));

// Rate limiting - exclude health endpoints
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // Default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // Default 100 requests per window
  message: {
    error: process.env.RATE_LIMIT_MESSAGE || "Too many requests from this IP, please try again later.",
    retryAfter: parseInt(process.env.RATE_LIMIT_RETRY_AFTER || '900')
  },
  standardHeaders: process.env.RATE_LIMIT_STANDARD_HEADERS !== 'false', // Default true
  legacyHeaders: process.env.RATE_LIMIT_LEGACY_HEADERS === 'true', // Default false
  // Skip validation for X-Forwarded-For in containerized environments
  validate: {
    xForwardedForHeader: false
  },
  // Skip rate limiting for health endpoints
  skip: (req) => {
    const skipPaths = (process.env.RATE_LIMIT_SKIP_PATHS || '/api/health,/api/version').split(',');
    return skipPaths.includes(req.path);
  }
});

// TEMPORARILY DISABLED for debugging
// app.use(limiter);

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: process.env.SESSION_RESAVE === 'true' || false,
  saveUninitialized: process.env.SESSION_SAVE_UNINITIALIZED === 'true' || false,
  cookie: {
    secure: process.env.SESSION_SECURE === 'true' || process.env.NODE_ENV === 'production',
    httpOnly: process.env.SESSION_HTTP_ONLY !== 'false', // Default true, can be disabled
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'), // Default 24 hours in ms
    sameSite: (process.env.SESSION_SAME_SITE as 'strict' | 'lax' | 'none') || 'lax'
  },
  name: process.env.SESSION_NAME || 'ospo.sid'
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Create uploads directory if it doesn't exist
// Use environment variable or default to public/uploads for backward compatibility
const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

// File upload middleware is now configured per-route in routes.ts

// Set up proxy for Keycloak authentication
// This proxies requests from /auth to the internal Keycloak service
// We need to use the correct K8s service name and port
// In Kubernetes, services are accessed by their service name
// No need for full DNS name - Kubernetes DNS will handle the resolution
const keycloakServiceName = process.env.KEYCLOAK_SERVICE_NAME || 'keycloak';
const keycloakServicePort = process.env.KEYCLOAK_SERVICE_PORT || '8080';

// Use simple service name which will be resolved by Kubernetes DNS automatically
const keycloakInternalUrl = `http://${keycloakServiceName}:${keycloakServicePort}`;

console.log(`Using Keycloak service at: ${keycloakInternalUrl}`);

console.log(`Setting up Keycloak proxy to internal URL: ${keycloakInternalUrl}`);

// Basic proxy configuration
// We need to match the KC_HTTP_RELATIVE_PATH setting in the Keycloak container
// Since Keycloak is configured with KC_HTTP_RELATIVE_PATH = "/auth", it expects
// requests to come with the /auth prefix. However, our proxy is forwarding
// /auth requests to http://keycloak:8080/auth, which would create /auth/auth
// So we need to strip the /auth prefix before forwarding to Keycloak
const proxyForwardedHost = process.env.PROXY_FORWARDED_HOST || `localhost:${process.env.PORT || '4576'}`;
const proxyForwardedProto = process.env.PROXY_FORWARDED_PROTO || 'http';
const proxyForwardedPort = process.env.PROXY_FORWARDED_PORT || process.env.PORT || '4576';

const proxyOptions = {
  target: keycloakInternalUrl,
  changeOrigin: true,
  // Don't rewrite the path since we're using KC_HTTP_RELATIVE_PATH = "/auth" in Keycloak
  pathRewrite: {
    '^/auth': ''
  },
  // Preserve the original host header to maintain port information
  headers: {
    'X-Forwarded-Host': proxyForwardedHost,
    'X-Forwarded-Proto': proxyForwardedProto,
    'X-Forwarded-Port': proxyForwardedPort
  },
  // Handle redirects properly
  followRedirects: false,
  onProxyRes: (proxyRes: import("http").IncomingMessage, req: express.Request, res: express.Response) => {
    // Intercept redirect responses and fix the location header
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
      const location = proxyRes.headers.location;
      if (location && typeof location === "string") {
        const redirectPattern = process.env.PROXY_REDIRECT_PATTERN || 'localhost/auth';
        const redirectReplacement = process.env.PROXY_REDIRECT_REPLACEMENT || `localhost:${process.env.PORT || '4576'}/auth`;
        if (location.includes(redirectPattern)) {
          proxyRes.headers.location = location.replace(redirectPattern, redirectReplacement);
          console.log(`Fixed redirect from ${location} to ${proxyRes.headers.location}`);
        }
      }
    }
  }
};

// Create the proxy middleware
const keycloakProxy = createProxyMiddleware(proxyOptions);

// Add custom logging and error handling for proxy requests
app.use('/auth', (req, res, next) => {
  console.log(`Proxying Keycloak request: ${req.method} ${req.url}`);

  // Set a timeout to handle connection issues
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error('Keycloak proxy request timed out');
      res.status(503).send(`
        <html>
          <head><title>Keycloak Service Unavailable</title></head>
          <body>
            <h1>Keycloak Service Temporarily Unavailable</h1>
            <p>The authentication service is currently starting or unavailable. Please try again in a few moments.</p>
            <p><a href="javascript:window.location.reload()">Click here to retry</a></p>
          </body>
        </html>
      `);
    }
  }, parseInt(process.env.PROXY_TIMEOUT_MS || '10000')); // Default 10 second timeout

  keycloakProxy(req, res, (err: any) => {
    // Clear the timeout since the request completed (with or without error)
    clearTimeout(timeoutId);

    if (err) {
      console.error('Proxy error:', err);
      if (!res.headersSent) {
        res.status(503).send(`
          <html>
            <head><title>Keycloak Service Unavailable</title></head>
            <body>
              <h1>Keycloak Service Temporarily Unavailable</h1>
              <p>The authentication service is currently starting or unavailable. Please try again in a few moments.</p>
              <p><a href="javascript:window.location.reload()">Click here to retry</a></p>
            </body>
          </html>
        `);
      }
      return;
    }

    // If we get here, the proxy was successful
    next();
  });
});

console.log('Keycloak proxy middleware enabled to match production configuration');

// Import storage for user creation
import { storage } from './storage';

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

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

// Add public endpoints BEFORE authentication middleware
// Version endpoint - publicly accessible (outside /api to avoid auth middleware)
app.get("/version", async (_req: Request, res: Response) => {
  console.log("Version endpoint hit!");
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    console.log("Returning version data:", packageData.version);
    res.json({
      name: packageData.name,
      version: packageData.version,
      description: packageData.description,
      timestamp: new Date().toISOString(),
      buildDate: process.env.BUILD_DATE || new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    console.error("Version check failed:", error);
    res.status(500).json({
      error: "Failed to retrieve version information"
    });
  }
});

(async () => {
  // Initialize Keycloak first
  let keycloak;
  try {
    console.log("Initializing Keycloak authentication...");
    keycloak = await initKeycloak(app);
  } catch (error) {
    console.error("Failed to initialize Keycloak:", error);
    keycloak = null;
  }

  // Initialize the database tables if we're using the database
  if (process.env.KUBERNETES_SERVICE_HOST || process.env.DATABASE_URL) {
    try {
      console.log("Attempting to initialize database tables...");
      const dbInitialized = await initializeDatabase();
      if (!dbInitialized) {
        console.error("Failed to initialize database tables. Some functionality may not work correctly.");
      } else {
        console.log("Database tables initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  // Apply Keycloak route protection middleware BEFORE registering other routes
  console.log("Securing routes with Keycloak authentication");
  console.log(`Keycloak instance status: ${keycloak ? 'VALID' : 'NULL/UNDEFINED'}`);
  if (keycloak) {
    console.log(`Keycloak instance type: ${typeof keycloak}`);

    // Protect API routes (except health check and version) with Bearer token support
    const authMiddleware = getAuthMiddleware(keycloak);
    app.use('/api', (req, res, next) => {
      // Allow health check, version, fix, and keycloak-config endpoints without authentication
      if (req.path === '/health' || req.path === '/version' || req.path === '/fix-david-asset' || req.path === '/keycloak-config') {
        return next();
      }

      // All other API routes require authentication (Bearer token or session)
      authMiddleware(req, res, next);
    });
  } else {
    console.error('CRITICAL SECURITY WARNING: Keycloak not initialized, implementing emergency security measures');

    // SECURITY: When Keycloak is not available, implement strict fallback security
    app.use('/api', (req, res, next) => {
      // Allow health check, version, and keycloak-config endpoints without authentication
      if (req.path === '/health' || req.path === '/version' || req.path === '/keycloak-config') {
        return next();
      }

      // SECURITY: Block all other API access when authentication is unavailable
      console.error(`SECURITY BLOCK: Rejecting unauthenticated access to ${req.method} /api${req.path}`);
      res.status(503).json({
        error: "Authentication service unavailable",
        message: "API access is temporarily restricted due to authentication service issues. Please try again later.",
        timestamp: new Date().toISOString()
      });
    });
  }

  // Register API routes AFTER applying protection middleware
  let server;
  if (app.get("env") === "development") {
    // Import Vite functions only in development
    const { setupVite } = await import("./vite");
    server = await registerRoutes(app);
    await setupVite(app, server);
  } else {
    // Register API routes
    server = await registerRoutes(app);

    // Production static file serving - register AFTER API routes
    const staticPath = path.resolve(process.cwd(), "server", "public");

    if (!fs.existsSync(staticPath)) {
      throw new Error(`Could not find static files directory: ${staticPath}`);
    }

    // Serve static files with proper MIME types
    app.use(express.static(staticPath, {
      setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.mjs')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));

    // Fallback to index.html for client-side routing (only for non-API and non-asset requests)
    app.use("*", (req, res) => {
      // Don't serve HTML for API requests, version endpoint, or asset requests
      if (req.originalUrl.startsWith('/api/') || req.originalUrl === '/version' || req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return res.status(404).send('Not found');
      }
      res.sendFile(path.resolve(staticPath, "index.html"));
    });
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Use port from environment variable or default to 4576
  const port = parseInt(process.env.PORT || "4576", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      log(`serving on port ${port}`);
      log(`version: ${packageData.version}`);
      log(`environment: ${process.env.NODE_ENV || 'development'}`);
    } catch (error) {
      log(`serving on port ${port}`);
      log(`version: unknown (error reading package.json)`);
    }
  });
})();
