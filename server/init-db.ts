import { db, pool } from "./db";
import { Pool } from 'pg';

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

  // Test the connection
  try {
    await pool.query('SELECT NOW()');
    console.log("✅ Database connection test successful");

    // Check what columns exist in events table
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);

    console.log("Current events table columns:", result.rows);
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
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
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

        // Add missing columns to users table if they don't exist and fix constraints
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS headshot TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences TEXT`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`);
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()`);

      // Remove NOT NULL constraints from optional columns
      await pool.query(`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`);
      await pool.query(`ALTER TABLE users ALTER COLUMN name DROP NOT NULL`);

      console.log("✅ Added missing columns to users table and fixed constraints");
    } catch (error) {
      console.log("Users table columns already exist or constraints already correct");
    }

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
        status TEXT NOT NULL DEFAULT 'planning',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add missing columns if they don't exist
    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS link TEXT NOT NULL DEFAULT 'https://example.com'
      `);
      console.log("✅ Added link column to events table if missing");
    } catch (error) {
      console.log("Link column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
      `);
      console.log("✅ Added priority column to events table if missing");
    } catch (error) {
      console.log("Priority column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      console.log("✅ Added created_at column to events table if missing");
    } catch (error) {
      console.log("Created_at column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      console.log("✅ Added updated_at column to events table if missing");
    } catch (error) {
      console.log("Updated_at column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS goal TEXT[] NOT NULL DEFAULT '{attending}'
      `);
      console.log("✅ Added goal column to events table if missing");
    } catch (error) {
      console.log("Goal column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS cfp_deadline TEXT
      `);
      console.log("✅ Added cfp_deadline column to events table if missing");
    } catch (error) {
      console.log("cfp_deadline column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'conference'
      `);
      console.log("✅ Added type column to events table if missing");
    } catch (error) {
      console.log("Type column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'planning'
      `);
      console.log("✅ Added status column to events table if missing");
    } catch (error) {
      console.log("Status column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS notes TEXT
      `);
      console.log("✅ Added notes column to events table if missing");
    } catch (error) {
      console.log("Notes column already exists or other constraint issue");
    }

    try {
      await pool.query(`
        ALTER TABLE events
        ADD COLUMN IF NOT EXISTS created_by_id INTEGER
      `);
      console.log("✅ Added created_by_id column to events table if missing");
    } catch (error) {
      console.log("Created_by_id column already exists or other constraint issue");
    }

    // Remove the defaults after adding the columns
    try {
      await pool.query(`
        ALTER TABLE events
        ALTER COLUMN link DROP DEFAULT,
        ALTER COLUMN priority DROP DEFAULT
      `);
    } catch (error) {
      // Ignore if columns don't have defaults
    }

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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sponsorships (
        id SERIAL PRIMARY KEY,
        event_id INTEGER NOT NULL,
        sponsor_name TEXT NOT NULL,
        tier TEXT NOT NULL,
        amount TEXT,
        contact_email TEXT,
        contact_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Add missing columns to existing sponsorships table if they don't exist
    try {
      await pool.query(`
        ALTER TABLE sponsorships
        ADD COLUMN IF NOT EXISTS sponsor_name TEXT,
        ADD COLUMN IF NOT EXISTS tier TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
      `);

      // Update any existing records to have default values
      await pool.query(`
        UPDATE sponsorships
        SET sponsor_name = COALESCE(sponsor_name, 'Unknown Sponsor'),
            tier = COALESCE(tier, 'Standard'),
            created_at = COALESCE(created_at, NOW()),
            updated_at = COALESCE(updated_at, NOW())
        WHERE sponsor_name IS NULL OR tier IS NULL OR created_at IS NULL OR updated_at IS NULL
      `);

      // Make sponsor_name and tier NOT NULL after setting defaults
      await pool.query(`
        ALTER TABLE sponsorships
        ALTER COLUMN sponsor_name SET NOT NULL,
        ALTER COLUMN tier SET NOT NULL
      `);
    } catch (error) {
      console.log("Note: Could not update sponsorships table structure:", error);
    }
    console.log("✅ Sponsorships table initialized");

    // Create assets table with IF NOT EXISTS to preserve existing data
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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
    await pool.query(`
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

    // Create sessions table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    // Add index on expire for faster session cleanup
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)
    `);
    console.log("✅ Sessions table initialized");

    console.log("✅ Database initialization completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error during database initialization:", error);
    return false;
  }
}