import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// THIS APP IS DESIGNED FOR DEPLOYMENT IN KUBERNETES ON DOCKER DESKTOP
// IT WILL NOT BE DEPLOYED IN PRODUCTION ON REPLIT

// Configure PostgreSQL connection specifically for Kubernetes
// Default to internal postgres service in Kubernetes
const connectionConfig = {
  host: process.env.PGHOST || 'postgres', // Service name in Kubernetes
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE || 'postgres',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD,
  // Local Kubernetes on Docker Desktop doesn't need SSL
  ssl: false
};

// Log connection info for debugging (but never show password)
console.log("Kubernetes PostgreSQL connection info:");
console.log(`Host: ${connectionConfig.host}`);
console.log(`Port: ${connectionConfig.port}`);
console.log(`Database: ${connectionConfig.database}`);
console.log(`User: ${connectionConfig.user}`);

// WARNING - When testing in Replit, we use DATABASE_URL temporarily
if (!connectionConfig.password && process.env.DATABASE_URL) {
  console.log("TEMPORARY DEVELOPMENT MODE: Using DATABASE_URL for testing in Replit only");
  console.log("NOTE: This will be REMOVED for Kubernetes deployment");
  
  // Create a new configuration object instead of modifying the existing one
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false
  };
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