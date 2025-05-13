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
        status TEXT NOT NULL DEFAULT 'planning',
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        location TEXT NOT NULL,
        priority TEXT NOT NULL,
        goal TEXT[], -- Changed from 'goals' to handle array of goals
        cfp_deadline DATE,
        notes TEXT,
        created_by_id INTEGER REFERENCES users(id)
      );
    `);
    console.log("✅ Events table created or updated");

    // Create CFP submissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS cfp_submissions (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL, 
        submitter_id INTEGER REFERENCES users(id),
        submitter_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        submission_date DATE,
        notes TEXT
      );
    `);
    console.log("✅ CFP submissions table created or updated");

    // Create attendees table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS attendees (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT,
        user_id INTEGER REFERENCES users(id),
        notes TEXT
      );
    `);
    console.log("✅ Attendees table created or updated");

    // Create sponsorships table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sponsorships (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        level TEXT NOT NULL,
        amount TEXT,
        status TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT,
        notes TEXT
      );
    `);
    console.log("✅ Sponsorships table created or updated");

    // Create assets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL REFERENCES users(id),
        uploaded_by_name TEXT,
        event_id INTEGER REFERENCES events(id),
        cfp_submission_id INTEGER REFERENCES cfp_submissions(id),
        description TEXT,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Assets table created or updated");

    // Create stakeholders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stakeholders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        department TEXT,
        organization TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ Stakeholders table created or updated");

    // Create approval workflows table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requester_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date DATE,
        priority TEXT NOT NULL DEFAULT 'medium',
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
        status TEXT NOT NULL DEFAULT 'pending',
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
        stakeholder_id INTEGER NOT NULL REFERENCES stakeholders(id),
        notification_type TEXT NOT NULL DEFAULT 'email',
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
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        parent_id INTEGER REFERENCES workflow_comments(id)
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
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        previous_status TEXT,
        new_status TEXT
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
        await db.driver?.pool.end();
        console.log("Database connection closed");
      } catch (err) {
        console.log("Note: Could not explicitly close connection");
      }
    }
  }
}

// Execute the migration
migrateDatabase();