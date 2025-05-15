import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Configure database connection for Kubernetes or Replit
const getDatabaseConfig = () => {
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;

  if (isKubernetes) {
    console.log("KUBERNETES DEPLOYMENT: Connecting to PostgreSQL service in Kubernetes");
    // Get the namespace - in Docker Desktop this is typically "default"
    const namespace = process.env.KUBERNETES_NAMESPACE || "default";
    
    // Try multiple host options with fallbacks
    let host = "postgres"; // First try the short name
    
    // Try the fully qualified name if specified or as fallback
    if (process.env.PGHOST) {
      console.log(`Using PGHOST from environment: ${process.env.PGHOST}`);
      host = process.env.PGHOST;
    } else {
      // Assuming fully qualified service name - try all possibilities
      console.log(`Trying to connect using service in namespace ${namespace}`);
      console.log(`Will attempt: postgres, postgres.${namespace}, postgres.${namespace}.svc.cluster.local`);
    }
    
    const port = parseInt(process.env.PGPORT || "5432", 10);
    const database = process.env.PGDATABASE || "ospo_events";
    const user = process.env.PGUSER || "ospo_user";
    const password = process.env.PGPASSWORD || "postgres_password";

    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`Database: ${database}`);
    console.log(`User: ${user}`);

    return {
      host,
      port,
      database,
      user,
      password
    };
  } else if (process.env.DATABASE_URL) {
    // Use provided DATABASE_URL (e.g. for Replit PostgreSQL)
    console.log("Using provided DATABASE_URL from environment");
    return {
      connectionString: process.env.DATABASE_URL
    };
  } else {
    console.log("No database configuration found, using in-memory storage");
    return null;
  }
};

const dbConfig = getDatabaseConfig();

// Set up the database connection if available
export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (dbConfig) {
  try {
    console.log("Creating PostgreSQL connection pool with config:", {
      ...dbConfig,
      password: dbConfig.password ? "********" : undefined // Mask the password in logs
    });
    
    // Set more aggressive connection retry behavior
    pool = new Pool({
      ...dbConfig,
      connectionTimeoutMillis: 10000, // 10 second timeout
      max: 20, // Maximum 20 clients
      idleTimeoutMillis: 30000, // 30 second idle timeout
      allowExitOnIdle: false, // Don't exit on idle
    });
    
    // Setup connection event handlers
    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
      // Don't crash on connection errors
    });
    
    // Initialize drizzle ORM
    db = drizzle(pool, { schema });
    console.log("PostgreSQL connection pool and Drizzle ORM initialized");
    
    // Test the connection
    console.log("Testing PostgreSQL connection...");
    pool.query('SELECT 1')
      .then(() => console.log("✅ PostgreSQL connection successful"))
      .catch(err => console.error("❌ PostgreSQL connection test failed:", err));
      
  } catch (err) {
    console.error("Failed to create PostgreSQL connection pool:", err);
    pool = null;
    db = null;
    console.log("Application will run without database persistence until the database becomes available");
  }
}