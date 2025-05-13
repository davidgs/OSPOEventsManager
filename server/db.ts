import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For debugging
console.log("Database configuration:");
console.log(`PGHOST: ${process.env.PGHOST}`);
console.log(`PGPORT: ${process.env.PGPORT}`);
console.log(`PGDATABASE: ${process.env.PGDATABASE}`);
console.log(`PGUSER: ${process.env.PGUSER}`);
console.log("DATABASE_URL is set:", !!process.env.DATABASE_URL);

// When not using Neon, construct the connection URL directly
let connectionString = process.env.DATABASE_URL;

// For Kubernetes environment, use direct PostgreSQL connection instead of WebSocket
if (process.env.KUBERNETES_SERVICE_HOST) {
  // In Kubernetes, the service name will be 'postgres'
  connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@postgres:${process.env.PGPORT}/${process.env.PGDATABASE}`;
  console.log("Running in Kubernetes, using direct Postgres connection");
}

console.log("Connection string:", connectionString.replace(/:[^:]*@/, ':****@')); // Hide password in logs

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });