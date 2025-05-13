import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// THIS APP IS DESIGNED FOR DEPLOYMENT IN KUBERNETES ON DOCKER DESKTOP
// IT SHOULD CONNECT TO THE POSTGRESQL SERVICE RUNNING IN THE KUBERNETES CLUSTER

// Determine connection configuration
let connectionConfig;

console.log("KUBERNETES DEPLOYMENT: Connecting to PostgreSQL service in Kubernetes");

// Values from the Helm chart (k8s/ospo-app-chart/values.yaml)
// Using the service name from postgresql-deployment.yaml to connect to the in-cluster database
const k8sPostgresValues = {
  host: 'postgres',          // Service name from Kubernetes (postgresql-deployment.yaml) 
  port: 5432,                // Default PostgreSQL port
  database: 'ospo_events',   // From values.yaml
  user: 'ospo_user',         // From values.yaml
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