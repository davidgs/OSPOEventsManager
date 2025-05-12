import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function updateAssetsTable() {
  console.log("Starting assets table update...");

  try {
    // Check if uploaded_by_name column exists
    const columns = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'assets' AND column_name = 'uploaded_by_name';
    `);
    
    const hasUploadedByName = columns.rows && columns.rows.length > 0;
    
    if (!hasUploadedByName) {
      console.log("Adding uploaded_by_name column...");
      // Add uploaded_by_name column
      await db.execute(sql`
        ALTER TABLE assets ADD COLUMN uploaded_by_name TEXT;
      `);
      console.log("✅ uploaded_by_name column added");

      // Update the uploaded_by_name values based on users table
      console.log("Updating uploaded_by_name values...");
      await db.execute(sql`
        UPDATE assets a 
        SET uploaded_by_name = u.name 
        FROM users u 
        WHERE a.uploaded_by = u.id
      `);
      console.log("✅ uploaded_by_name values updated");
    } else {
      console.log("uploaded_by_name column already exists.");
    }

    console.log("✅ Assets table update completed successfully!");
  } catch (error) {
    console.error("❌ Error during assets table update:", error);
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

updateAssetsTable();