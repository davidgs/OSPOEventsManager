import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Log database connection info for debugging
console.log("Database configuration:");
console.log(`PGHOST: ${process.env.PGHOST}`);
console.log(`PGPORT: ${process.env.PGPORT}`);
console.log(`PGDATABASE: ${process.env.PGDATABASE}`);
console.log(`PGUSER: ${process.env.PGUSER}`);
console.log(`DATABASE_URL is set: ${!!process.env.DATABASE_URL}`);

// Validate connection info
// In Kubernetes we might not use DATABASE_URL but individual environment variables
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST || process.env.NODE_ENV === 'production';
if (!process.env.DATABASE_URL && !isKubernetes) {
  console.error("DATABASE_URL environment variable not set and not in Kubernetes environment");
  throw new Error("Database configuration incomplete. DATABASE_URL or individual PG* variables required.");
}

// Configure PostgreSQL connection
const connectionConfig = process.env.DATABASE_URL 
  ? {
      // Use connection string if provided (Replit environment)
      connectionString: process.env.DATABASE_URL,
      // Disable SSL for local Replit database, but allow it for Kubernetes with proper config
      ssl: isKubernetes ? { rejectUnauthorized: false } : false
    } 
  : {
      // Use individual connection parameters (Kubernetes environment)
      host: process.env.PGHOST || 'postgres', // Use 'postgres' service name in Kubernetes by default
      port: parseInt(process.env.PGPORT || '5432'),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD,
      // SSL configuration for Kubernetes environment
      ssl: isKubernetes ? { rejectUnauthorized: false } : false
    };

console.log(`Running in ${isKubernetes ? 'Kubernetes' : 'local'} environment`);

console.log("Connecting to PostgreSQL using connection string");

// Create connection pool
const pool = new Pool(connectionConfig);

// Set up error handler
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

console.log("PostgreSQL connection pool created, initializing Drizzle ORM");
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