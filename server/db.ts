import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// THIS APP IS DESIGNED FOR DEPLOYMENT IN KUBERNETES ON DOCKER DESKTOP
// IT WILL NOT BE DEPLOYED IN PRODUCTION ON REPLIT

// Determine connection configuration
let connectionConfig;

// For Replit environment, use the provided PostgreSQL database
if (process.env.PGDATABASE && process.env.PGUSER && process.env.PGHOST) {
  console.log("REPLIT ENVIRONMENT: Using local PostgreSQL");
  
  // Check if we're connecting to Neon cloud database (requires SSL)
  const isNeonDatabase = process.env.PGHOST?.includes('neon.tech');
  
  connectionConfig = {
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: isNeonDatabase ? { rejectUnauthorized: false } : false
  };
  
  // Log connection info for debugging (but never show password)
  console.log(`Host: ${connectionConfig.host}`);
  console.log(`Port: ${connectionConfig.port}`);
  console.log(`Database: ${connectionConfig.database}`);
  console.log(`User: ${connectionConfig.user}`);
} 
// Fallback to DATABASE_URL if available
else if (process.env.DATABASE_URL) {
  console.log("FALLBACK MODE: Using connection string from DATABASE_URL");
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
  
  // Mask password in connection string for logging
  const maskedConnString = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connection string: ${maskedConnString}`);
} 
// Default case for Kubernetes deployment
else {
  console.log("KUBERNETES DEPLOYMENT: Connecting to local PostgreSQL");
  
  // Values from the Helm chart (k8s/ospo-app-chart/values.yaml)
  const k8sPostgresValues = {
    host: 'postgres', // Service name from postgresql-deployment.yaml
    port: 5432,       // Default PostgreSQL port
    database: 'ospo_events', // From values.yaml
    user: 'ospo_user',       // From values.yaml
    password: 'ospo_password123'  // From values.yaml
  };
  
  connectionConfig = {
    host: k8sPostgresValues.host,
    port: k8sPostgresValues.port,
    database: k8sPostgresValues.database,
    user: k8sPostgresValues.user,
    password: k8sPostgresValues.password,
    ssl: false
  };
  
  // Log connection info for debugging (but never show password)
  console.log(`Host: ${connectionConfig.host}`);
  console.log(`Port: ${connectionConfig.port}`);
  console.log(`Database: ${connectionConfig.database}`);
  console.log(`User: ${connectionConfig.user}`);
}

// Create connection pool
const pool = new Pool(connectionConfig);

// Set up error handler
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

console.log("PostgreSQL connection pool created for Kubernetes deployment");
const db = drizzle(pool, { schema });

// Function to properly shut down the pool on application exit
const closePool = async () => {
  console.log('Closing PostgreSQL connection pool');
  await pool.end();
};

// Handle application shutdown correctly
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

// Export the pool and db
export { pool, db };