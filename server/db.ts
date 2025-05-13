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
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL environment variable not set");
  throw new Error("Database configuration incomplete. DATABASE_URL is required.");
}

// Configure PostgreSQL connection
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon Postgres
};

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