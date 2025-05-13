import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { Pool } from '@neondatabase/serverless';

/**
 * Initializes the database by creating the required tables
 * This function runs at application startup to ensure tables exist
 */
export async function initializeDatabase(): Promise<boolean> {
  console.log("Initializing database tables (if they don't exist)...");
  
  // If there is no pool, we can't initialize the database
  if (!pool) {
    console.error("Database connection pool not available for initialization");
    return false;
  }

  try {
    // Create tables using direct pool.query for more reliable execution
    await pool.query(`
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
      )
    `);
    console.log("✅ Users table initialized");

    // Create events table with IF NOT EXISTS to preserve existing data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        location TEXT NOT NULL,
        type TEXT NOT NULL,
        priority TEXT NOT NULL,
        goal TEXT[] NOT NULL,
        link TEXT NOT NULL,
        cfp_deadline TEXT,
        notes TEXT,
        created_by_id INTEGER,
        status TEXT NOT NULL DEFAULT 'planning'
      )
    `);
    console.log("✅ Events table initialized");
    
    // Create CFP submissions table with IF NOT EXISTS to preserve existing data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cfp_submissions (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        abstract TEXT NOT NULL,
        submitter_id INTEGER,
        submitter_name TEXT NOT NULL,
        submission_date TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        notes TEXT
      )
    `);
    console.log("✅ CFP submissions table initialized");

    // Create attendees table with IF NOT EXISTS to preserve existing data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendees (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        role TEXT,
        notes TEXT,
        user_id INTEGER
      )
    `);
    console.log("✅ Attendees table initialized");

    // Create sponsorships table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sponsorships (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        level TEXT NOT NULL,
        amount TEXT,
        status TEXT NOT NULL,
        contact_name TEXT,
        contact_email TEXT,
        notes TEXT
      )
    `);
    console.log("✅ Sponsorships table initialized");

    // Create assets table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        uploaded_by INTEGER NOT NULL,
        uploaded_by_name TEXT,
        event_id INTEGER,
        cfp_submission_id INTEGER,
        description TEXT,
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Assets table initialized");

    // Create stakeholders table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stakeholders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        organization TEXT NOT NULL,
        department TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log("✅ Stakeholders table initialized");

    // Create approval_workflows table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS approval_workflows (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        item_type TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        requester_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        due_date DATE,
        priority TEXT NOT NULL DEFAULT 'medium',
        estimated_costs TEXT,
        metadata JSONB
      )
    `);
    console.log("✅ Approval workflows table initialized");

    // Create workflow_reviewers table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_reviewers (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL,
        reviewer_id INTEGER NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT TRUE,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_at TIMESTAMP,
        comments TEXT
      )
    `);
    console.log("✅ Workflow reviewers table initialized");

    // Create workflow_stakeholders table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_stakeholders (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL,
        stakeholder_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL DEFAULT 'email',
        notified_at TIMESTAMP
      )
    `);
    console.log("✅ Workflow stakeholders table initialized");

    // Create workflow_comments table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_comments (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        parent_id INTEGER
      )
    `);
    console.log("✅ Workflow comments table initialized");

    // Create workflow_history table with IF NOT EXISTS to preserve existing data
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workflow_history (
        id SERIAL PRIMARY KEY,
        workflow_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        details TEXT,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        previous_status TEXT,
        new_status TEXT
      )
    `);
    console.log("✅ Workflow history table initialized");

    console.log("✅ Database initialization completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    return false;
  }
}