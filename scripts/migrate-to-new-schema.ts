import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/database-schema.js';

// Database configuration
const getDatabaseConfig = () => {
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;
  const isDockerCompose = process.env.COMPOSE_PROJECT_NAME || process.env.DOCKER_COMPOSE;

  if (isKubernetes || isDockerCompose) {
    return {
      host: process.env.PGHOST || "postgres",
      port: parseInt(process.env.PGPORT || "5432", 10),
      database: process.env.PGDATABASE || "ospo_events",
      user: process.env.PGUSER || "ospo_user",
      password: process.env.PGPASSWORD || "postgres_password",
    };
  }

  return {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: process.env.PGDATABASE || "ospo_events",
    user: process.env.PGUSER || "ospo_user",
    password: process.env.PGPASSWORD || "postgres_password",
  };
};

async function ensureTableStructure() {
  const config = getDatabaseConfig();
  const pool = new Pool(config);
  const db = drizzle(pool, { schema });

  try {
    console.log('🔄 Migrating database to new schema structure...');

    // 1. Check and add missing columns in users table
    console.log('📋 Checking users table structure...');
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    const existingUsersColumns = usersColumns.rows.map(row => row.column_name);
    console.log('Existing users columns:', existingUsersColumns);

    if (!existingUsersColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to users table...');
      await db.execute(sql`
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    // 2. Check and add missing columns in events table
    console.log('📋 Checking events table structure...');
    const eventsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);

    const existingEventsColumns = eventsColumns.rows.map(row => row.column_name);
    console.log('Existing events columns:', existingEventsColumns);

    if (!existingEventsColumns.includes('type')) {
      console.log('➕ Adding type column to events table...');
      await db.execute(sql`
        ALTER TABLE events ADD COLUMN type TEXT NOT NULL DEFAULT 'conference';
      `);
    }

    if (!existingEventsColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to events table...');
      await db.execute(sql`
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    // 3. Check and add missing columns in cfp_submissions table
    console.log('📋 Checking cfp_submissions table structure...');
    const cfpColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'cfp_submissions'
      ORDER BY ordinal_position;
    `);

    const existingCfpColumns = cfpColumns.rows.map(row => row.column_name);
    console.log('Existing cfp_submissions columns:', existingCfpColumns);

    if (!existingCfpColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to cfp_submissions table...');
      await db.execute(sql`
        ALTER TABLE cfp_submissions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    if (!existingCfpColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to cfp_submissions table...');
      await db.execute(sql`
        ALTER TABLE cfp_submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    // 4. Check and add missing columns in attendees table
    console.log('📋 Checking attendees table structure...');
    const attendeesColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'attendees'
      ORDER BY ordinal_position;
    `);

    const existingAttendeesColumns = attendeesColumns.rows.map(row => row.column_name);
    console.log('Existing attendees columns:', existingAttendeesColumns);

    if (!existingAttendeesColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to attendees table...');
      await db.execute(sql`
        ALTER TABLE attendees ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    if (!existingAttendeesColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to attendees table...');
      await db.execute(sql`
        ALTER TABLE attendees ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    // 5. Check and fix sponsorships table
    console.log('📋 Checking sponsorships table structure...');
    const sponsorshipsColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'sponsorships'
      ORDER BY ordinal_position;
    `);

    const existingSponsorshipColumns = sponsorshipsColumns.rows.map(row => row.column_name);
    console.log('Existing sponsorships columns:', existingSponsorshipColumns);

    // Rename level column to tier if it exists
    if (existingSponsorshipColumns.includes('level') && !existingSponsorshipColumns.includes('tier')) {
      console.log('🔄 Renaming level column to tier in sponsorships table...');
      await db.execute(sql`
        ALTER TABLE sponsorships RENAME COLUMN level TO tier;
      `);
    }

    // 6. Check and add missing columns in stakeholders table
    console.log('📋 Checking stakeholders table structure...');
    const stakeholdersColumns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'stakeholders'
      ORDER BY ordinal_position;
    `);

    const existingStakeholdersColumns = stakeholdersColumns.rows.map(row => row.column_name);
    console.log('Existing stakeholders columns:', existingStakeholdersColumns);

    if (!existingStakeholdersColumns.includes('created_at')) {
      console.log('➕ Adding created_at column to stakeholders table...');
      await db.execute(sql`
        ALTER TABLE stakeholders ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    if (!existingStakeholdersColumns.includes('updated_at')) {
      console.log('➕ Adding updated_at column to stakeholders table...');
      await db.execute(sql`
        ALTER TABLE stakeholders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);
    }

    // 7. Verify all tables exist and have correct structure
    console.log('✅ Verifying final table structures...');

    const allTables = [
      'users', 'events', 'cfp_submissions', 'attendees', 'sponsorships',
      'assets', 'stakeholders', 'approval_workflows', 'workflow_reviewers',
      'workflow_stakeholders', 'workflow_comments', 'workflow_history'
    ];

    for (const tableName of allTables) {
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = ${tableName}
        );
      `);

      if (tableExists.rows[0].exists) {
        console.log(`✅ Table ${tableName} exists`);
      } else {
        console.log(`❌ Table ${tableName} missing`);
      }
    }

    console.log('🎉 Database schema migration completed successfully!');

    // Test the database with the new schema
    console.log('🧪 Testing database with new schema...');
    const eventCount = await db.execute(sql`SELECT COUNT(*) FROM events`);
    console.log(`📊 Total events: ${eventCount.rows[0].count}`);

    const userCount = await db.execute(sql`SELECT COUNT(*) FROM users`);
    console.log(`👥 Total users: ${userCount.rows[0].count}`);

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
ensureTableStructure().catch(console.error);