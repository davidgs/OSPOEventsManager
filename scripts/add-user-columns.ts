import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function addUserColumns() {
  console.log("Adding columns to users table...");

  try {
    // Add the missing columns to the users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS name TEXT,
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS role TEXT,
      ADD COLUMN IF NOT EXISTS job_title TEXT,
      ADD COLUMN IF NOT EXISTS headshot TEXT;
    `);
    
    console.log("✅ Added new columns to users table");

    // Set some default values for the first user
    await db.execute(sql`
      UPDATE users 
      SET 
        name = 'Alex Johnson', 
        email = 'alex@example.com', 
        bio = 'Senior Developer Advocate with expertise in Kubernetes and cloud-native technologies.',
        role = 'developer_advocate',
        job_title = 'Senior Developer Advocate'
      WHERE id = 1;
    `);
    
    console.log("✅ Updated user with ID 1");
    
    // View the updated user
    const result = await db.execute(sql`SELECT * FROM users WHERE id = 1;`);
    console.log("Updated user:", result.rows[0]);
    
    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error updating users table:", error);
  } finally {
    // Close the pool connection for @neondatabase/serverless
    if (db) {
      try {
        // @ts-ignore - Access the underlying pool
        await db[Symbol.for('driver')].session.end();
        console.log("Database connection closed");
      } catch (err) {
        console.log("Note: Could not explicitly close connection, but migration was completed");
      }
    }
  }
}

addUserColumns();