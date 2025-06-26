import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";
import { initKeycloak, secureWithKeycloak, keycloakUserMapper } from "./keycloak-config";
import { initializeDatabase } from "./init-db";
import { createProxyMiddleware } from 'http-proxy-middleware';
import fileUpload from "express-fileupload";

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
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
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
// If Keycloak is at '/', we need to rewrite '/auth' to '/'
// If Keycloak is at '/auth', we need to keep the path as is
const proxyOptions = {
  target: keycloakInternalUrl,
  changeOrigin: true,
  // Don't rewrite the path since we're using KC_HTTP_RELATIVE_PATH = "/auth" in Keycloak
  pathRewrite: {},
  // Preserve the original host header to maintain port information
  headers: {
    'X-Forwarded-Host': 'localhost:7654',
    'X-Forwarded-Proto': 'http',
    'X-Forwarded-Port': '7654'
  },
  // Handle redirects properly
  followRedirects: false,
  onProxyRes: (proxyRes: import("http").IncomingMessage, req: express.Request, res: express.Response) => {
    // Intercept redirect responses and fix the location header
    if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
      const location = proxyRes.headers.location;
      if (location && typeof location === "string" && location.includes('localhost/auth')) {
        proxyRes.headers.location = location.replace('localhost/auth', 'localhost:4576/auth');
        console.log(`Fixed redirect from ${location} to ${proxyRes.headers.location}`);
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
  }, 10000); // 10 second timeout

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
    next();
  });
});

// Import storage for user creation
import { storage } from './storage';

// Serve static files from the public directory
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

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
  // Initialize Keycloak first
  let keycloak;
  try {
    console.log("Initializing Keycloak authentication...");
    keycloak = await initKeycloak(app);

    // Apply Keycloak user mapping middleware
    app.use(async (req: any, res: any, next: any) => {
      // First apply the standard Keycloak user mapper
      keycloakUserMapper(req, res, async () => {
        try {
          // If we have a user from Keycloak and it's not in our database yet, create it
          if (req.user && req.user.id) {
            const keycloakId = req.user.id;
            const username = req.user.username;

            // Check if the user exists in our database
            const dbUser = await storage.getUserByKeycloakId(keycloakId);

            if (!dbUser) {
              console.log(`Creating new user record for Keycloak user: ${username} (${keycloakId})`);

              // Create a new user record in our database
              const newUser = await storage.createUser({
                keycloak_id: keycloakId,
                username,
                name: req.user.name || null,
                email: req.user.email || null
              });

              if (newUser) {
                console.log(`Successfully created user record with ID: ${newUser.id}`);
                req.user.dbId = newUser.id;
              }
            } else {
              console.log(`Found existing user record for Keycloak user: ${username}`);
              req.user.dbId = dbUser.id;
            }
          }
          next();
        } catch (error) {
          console.error("Error handling Keycloak user:", error);
          next();
        }
      });
    });
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

  // Setup static file serving first to handle assets before routes
  let server;
  if (app.get("env") === "development") {
    // Import Vite functions only in development
    const { setupVite } = await import("./vite");
    server = await registerRoutes(app);
    await setupVite(app, server);
  } else {
    server = await registerRoutes(app);
    // Production static file serving
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

    // Fallback to index.html for client-side routing (only for non-asset requests)
    app.use("*", (req, res) => {
      // Don't serve HTML for asset requests
      if (req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        return res.status(404).send('Asset not found');
      }
      res.sendFile(path.resolve(staticPath, "index.html"));
    });
  }

  // Always enable Keycloak authentication in production (no option to bypass)
  console.log("Securing routes with Keycloak authentication");
  console.log(`Keycloak instance status: ${keycloak ? 'VALID' : 'NULL/UNDEFINED'}`);
  if (keycloak) {
    console.log(`Keycloak instance type: ${typeof keycloak}`);
  }
  secureWithKeycloak(app, keycloak);

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
    log(`serving on port ${port}`);
  });
})();
