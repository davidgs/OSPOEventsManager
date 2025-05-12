import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function updateUsersTable() {
  console.log("Starting users table update...");

  try {
    // Check if keycloak_id column exists
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'keycloak_id';
    `);
    
    const hasKeycloakId = columns.rows && columns.rows.length > 0;
    
    if (!hasKeycloakId) {
      console.log("Adding keycloak_id column...");
      // Add keycloak_id column
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN keycloak_id TEXT UNIQUE;
      `);
      console.log("✅ keycloak_id column added");
    } else {
      console.log("keycloak_id column already exists.");
    }
    
    // Check if preferences column exists
    const preferencesColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'preferences';
    `);
    
    const hasPreferences = preferencesColumns.rows && preferencesColumns.rows.length > 0;
    
    if (!hasPreferences) {
      console.log("Adding preferences column...");
      // Add preferences column
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN preferences TEXT;
      `);
      console.log("✅ preferences column added");
    } else {
      console.log("preferences column already exists.");
    }
    
    // Check if last_login column exists
    const lastLoginColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'last_login';
    `);
    
    const hasLastLogin = lastLoginColumns.rows && lastLoginColumns.rows.length > 0;
    
    if (!hasLastLogin) {
      console.log("Adding last_login column...");
      // Add last_login column
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
      `);
      console.log("✅ last_login column added");
    } else {
      console.log("last_login column already exists.");
    }
    
    // Check if created_at column exists
    const createdAtColumns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'created_at';
    `);
    
    const hasCreatedAt = createdAtColumns.rows && createdAtColumns.rows.length > 0;
    
    if (!hasCreatedAt) {
      console.log("Adding created_at column...");
      // Add created_at column with default value
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      console.log("✅ created_at column added");
    } else {
      console.log("created_at column already exists.");
    }

    console.log("✅ Users table update completed successfully!");
  } catch (error) {
    console.error("❌ Error during users table update:", error);
  } finally {
    // Close the database connection
    if (db) {
      try {
        // @ts-ignore - Access the underlying pool
        await db[Symbol.for('driver')].session.end();
        console.log("Database connection closed");
      } catch (err) {
        console.log("Note: Could not explicitly close connection");
      }
    }
  }
}

updateUsersTable();