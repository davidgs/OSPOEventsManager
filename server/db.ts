import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// THIS APP IS DESIGNED FOR DEPLOYMENT IN KUBERNETES ON DOCKER DESKTOP
// IT WILL NOT BE DEPLOYED IN PRODUCTION ON REPLIT

// Determine connection configuration
let connectionConfig;

// First check if DATABASE_URL is available (for development in Replit)
if (process.env.DATABASE_URL) {
  console.log("Using connection string for temporary development");
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    // Based on error, we need SSL for Neon Postgres
    ssl: { rejectUnauthorized: false }
  };
  
  // Mask password in connection string for logging
  const maskedConnString = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connection string: ${maskedConnString}`);
} 
// For Kubernetes deployment, use individual parameters
else {
  console.log("Using Kubernetes PostgreSQL configuration");
  connectionConfig = {
    host: process.env.PGHOST || 'postgres', // Service name in Kubernetes
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    // For Kubernetes deployment, SSL depends on the PostgreSQL setup
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
  };
  
  // Log connection info for debugging (but never show password)
  console.log(`Host: ${connectionConfig.host}`);
  console.log(`Port: ${connectionConfig.port}`);
  console.log(`Database: ${connectionConfig.database}`);
  console.log(`User: ${connectionConfig.user}`);
  console.log(`SSL: ${!!connectionConfig.ssl}`);
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