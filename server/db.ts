import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../shared/database-schema.js';

// Type-safe database configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// Get database configuration based on environment
const getDatabaseConfig = (): DatabaseConfig => {
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;
  const isDockerCompose = process.env.COMPOSE_PROJECT_NAME || process.env.DOCKER_COMPOSE;

  if (isKubernetes || isDockerCompose) {
    const deploymentType = isDockerCompose ? "DOCKER COMPOSE" : "KUBERNETES";
    console.log(`${deploymentType} DEPLOYMENT: Connecting to PostgreSQL service`);

    // If DATABASE_URL is provided, use it directly
    if (process.env.DATABASE_URL) {
      console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')}`);
      // Parse DATABASE_URL to extract components
      const url = new URL(process.env.DATABASE_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port || "5432", 10),
        database: url.pathname.slice(1), // Remove leading slash
        user: url.username,
        password: url.password,
        ssl: false
      };
    }

    // Fallback to individual environment variables
    return {
      host: process.env.PGHOST || "postgres",
      port: parseInt(process.env.PGPORT || "5432", 10),
      database: process.env.PGDATABASE || "ospo_events",
      user: process.env.PGUSER || "ospo_user",
      password: process.env.PGPASSWORD || "postgres_password",
      ssl: false
    };
  }

  // Local development configuration
  console.log("LOCAL DEVELOPMENT: Connecting to local PostgreSQL");

  // If DATABASE_URL is provided, use it directly
  if (process.env.DATABASE_URL) {
    console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@')}`);
    const url = new URL(process.env.DATABASE_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      database: url.pathname.slice(1), // Remove leading slash
      user: url.username,
      password: url.password,
      ssl: false
    };
  }

  // Fallback to individual environment variables
  return {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "ospo_events",
    user: process.env.PGUSER || "ospo_user",
    password: process.env.PGPASSWORD || "postgres_password",
    ssl: false
  };
};

// Create connection pool with proper configuration
const config = getDatabaseConfig();
export const pool = new Pool(config);

// Initialize Drizzle ORM with typed schema
export const db = drizzle(pool, { schema });

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Export schema for use in other modules
export { schema };

// Export individual tables for convenience
export const {
  users,
  events,
  cfpSubmissions,
  attendees,
  sponsorships,
  assets,
  stakeholders,
  approvalWorkflows,
  workflowReviewers,
  workflowStakeholders,
  workflowComments,
  workflowHistory
} = schema;

// Health check for database
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as timestamp');
    client.release();

    return {
      status: 'healthy',
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize database connection on module load
testConnection().catch(console.error);

console.log('📊 Database initialized with strongly typed schema');