import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Configure database connection for Kubernetes or Replit
const getPgConnectionString = () => {
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;

  if (isKubernetes) {
    console.log("KUBERNETES DEPLOYMENT: Connecting to PostgreSQL service in Kubernetes");
    // In Kubernetes, connect to the database service by name
    const host = "postgres"; // Service name in Kubernetes
    const port = 5432;
    const database = "ospo_events";
    const user = "ospo_user";
    const password = process.env.PGPASSWORD || "postgres_password";

    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`Database: ${database}`);
    console.log(`User: ${user}`);

    return `postgresql://${user}:${password}@${host}:${port}/${database}`;
  } else if (process.env.DATABASE_URL) {
    // Use provided DATABASE_URL (e.g. for Replit PostgreSQL)
    console.log("Using provided DATABASE_URL from environment");
    return process.env.DATABASE_URL;
  } else {
    console.log("No database configuration found, using in-memory storage");
    return null;
  }
};

const connectionString = getPgConnectionString();

// Set up the database connection if available
export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (connectionString) {
  try {
    pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
    console.log("PostgreSQL connection pool created for Kubernetes deployment");
  } catch (err) {
    console.error("Failed to create PostgreSQL connection pool:", err);
    pool = null;
    db = null;
  }
}