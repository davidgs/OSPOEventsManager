import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// THIS APP IS DESIGNED FOR DEPLOYMENT IN KUBERNETES ON DOCKER DESKTOP
// IT WILL NOT BE DEPLOYED IN PRODUCTION ON REPLIT

// Determine connection configuration
let connectionConfig;

// Detect Kubernetes environment
const isKubernetes = process.env.KUBERNETES_SERVICE_HOST || 
                     process.env.NODE_ENV === 'production';

// Use DATABASE_URL if available for development/testing in Replit
if (process.env.DATABASE_URL && !isKubernetes) {
  console.log("DEVELOPMENT MODE: Using connection string temporarily");
  connectionConfig = {
    connectionString: process.env.DATABASE_URL,
    // Neon Postgres requires SSL
    ssl: { rejectUnauthorized: false }
  };
  
  // Mask password in connection string for logging
  const maskedConnString = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
  console.log(`Connection string: ${maskedConnString}`);
} 
// For Kubernetes deployment, connect to local PostgreSQL pod
else {
  console.log("KUBERNETES DEPLOYMENT: Connecting to local PostgreSQL");
  
  // Values from the Helm chart (k8s/ospo-app-chart/values.yaml)
  const k8sPostgresValues = {
    host: 'postgres', // Service name from postgresql-deployment.yaml
    port: 5432,       // Default PostgreSQL port
    database: process.env.PGDATABASE || 'ospo_events', // From values.yaml
    user: process.env.PGUSER || 'ospo_user',           // From values.yaml
    password: process.env.PGPASSWORD || 'ospo_password123'  // From values.yaml
  };
  
  connectionConfig = {
    host: k8sPostgresValues.host,
    port: k8sPostgresValues.port,
    database: k8sPostgresValues.database,
    user: k8sPostgresValues.user,
    password: k8sPostgresValues.password,
    // Local PostgreSQL in Kubernetes doesn't need SSL
    ssl: false
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