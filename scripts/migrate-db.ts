import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrateDatabase() {
  console.log("Starting database migration...");

  try {
    // Create users table with new Keycloak-focused schema plus profile fields
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        keycloak_id TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        name TEXT,
        email TEXT,
        bio TEXT,
        job_title TEXT,
        headshot TEXT,
        role TEXT,
        preferences TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Users table created or updated");

    // Create events table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        link TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location TEXT NOT NULL,
        priority TEXT NOT NULL,
        goal TEXT[], -- Changed from 'goals' to handle array of goals
        cfp_deadline TEXT,
        notes TEXT,
        created_by_id INTEGER REFERENCES users(id)
      );
    `);
    console.log("✅ Events table created or updated");

    // Create approval workflows table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        requester_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date DATE,
        priority TEXT NOT NULL,
        estimated_costs TEXT,
        metadata JSONB
      );
    `);
    console.log("✅ Approval workflows table created or updated");

    // Create workflow reviewers table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_reviewers (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
        reviewer_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        reviewed_at TIMESTAMP,
        comments TEXT
      );
    `);
    console.log("✅ Workflow reviewers table created or updated");

    // Create workflow stakeholders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_stakeholders (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
        stakeholder_id INTEGER NOT NULL,
        notified BOOLEAN NOT NULL DEFAULT FALSE,
        notified_at TIMESTAMP
      );
    `);
    console.log("✅ Workflow stakeholders table created or updated");

    // Create workflow comments table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_comments (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        content TEXT NOT NULL
      );
    `);
    console.log("✅ Workflow comments table created or updated");

    // Create workflow history table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_history (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        previous_status TEXT,
        new_status TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Workflow history table created or updated");

    console.log("✅ Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during database migration:", error);
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

migrateDatabase();