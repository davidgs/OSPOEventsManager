import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from "../shared/schema.js";

// Database configuration function (matches server/db.ts)
const getDatabaseConfig = () => {
  const isKubernetes = process.env.KUBERNETES_SERVICE_HOST;
  const isDockerCompose = process.env.COMPOSE_PROJECT_NAME || process.env.DOCKER_COMPOSE;

  if (isKubernetes || isDockerCompose) {
    const deploymentType = isDockerCompose ? "DOCKER COMPOSE" : "KUBERNETES";
    console.log(`${deploymentType} DEPLOYMENT: Connecting to PostgreSQL service`);

    const host = process.env.PGHOST || "postgres";
    const port = parseInt(process.env.PGPORT || "5432", 10);
    const database = process.env.PGDATABASE || "ospo_events";
    const user = process.env.PGUSER || "ospo_user";
    const password = process.env.PGPASSWORD || "postgres_password";

    console.log(`Host: ${host}`);
    console.log(`Port: ${port}`);
    console.log(`Database: ${database}`);
    console.log(`User: ${user}`);

    return {
      host,
      port,
      database,
      user,
      password
    };
  } else if (process.env.DATABASE_URL) {
    console.log("Using provided DATABASE_URL from environment");
    return {
      connectionString: process.env.DATABASE_URL
    };
  } else {
    throw new Error("No database configuration found");
  }
};

async function fixDatabaseSchema() {
  console.log('🔧 Starting database schema fix...');

  // Setup database connection
  const dbConfig = getDatabaseConfig();
  const pool = new Pool({
    ...dbConfig,
    connectionTimeoutMillis: 10000,
    max: 20,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: false,
  });

  const db = drizzle(pool, { schema });

  console.log('Testing database connection...');
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }

  try {
    // Check current events table schema
    console.log('📋 Checking current events table schema...');
    const eventsColumns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'events'
      ORDER BY ordinal_position;
    `);

    console.log('Current events table columns:');
    eventsColumns.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check for missing columns
    const columnNames = eventsColumns.rows.map(row => row.column_name);
    const requiredColumns = ['type', 'updated_at', 'created_at'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));

    if (missingColumns.length > 0) {
      console.log(`\n🔧 Adding missing columns: ${missingColumns.join(', ')}`);

      // Add missing columns
      if (missingColumns.includes('type')) {
        await db.execute(sql`
          ALTER TABLE events ADD COLUMN type TEXT NOT NULL DEFAULT 'conference';
        `);
        console.log('✅ Added type column');
      }

      if (missingColumns.includes('created_at')) {
        await db.execute(sql`
          ALTER TABLE events ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
        `);
        console.log('✅ Added created_at column');
      }

      if (missingColumns.includes('updated_at')) {
        await db.execute(sql`
          ALTER TABLE events ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
        `);
        console.log('✅ Added updated_at column');
      }
    }

    // Check sponsorships table for the level vs tier issue
    console.log('\n📋 Checking sponsorships table schema...');
    const sponsorshipsColumns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sponsorships'
      ORDER BY ordinal_position;
    `);

    const sponsorshipColumnNames = sponsorshipsColumns.rows.map(row => row.column_name);

    // Fix the sponsorships table column naming issue
    if (sponsorshipColumnNames.includes('level') && !sponsorshipColumnNames.includes('tier')) {
      console.log('🔧 Renaming sponsorships.level to tier to match schema...');
      await db.execute(sql`
        ALTER TABLE sponsorships RENAME COLUMN level TO tier;
      `);
      console.log('✅ Renamed level to tier');
    }

    // Add missing sponsorships columns
    if (!sponsorshipColumnNames.includes('sponsor_name')) {
      await db.execute(sql`
        ALTER TABLE sponsorships ADD COLUMN sponsor_name TEXT NOT NULL DEFAULT 'Unknown Sponsor';
      `);
      console.log('✅ Added sponsor_name column');
    }

    if (!sponsorshipColumnNames.includes('created_at')) {
      await db.execute(sql`
        ALTER TABLE sponsorships ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      console.log('✅ Added created_at column to sponsorships');
    }

    if (!sponsorshipColumnNames.includes('updated_at')) {
      await db.execute(sql`
        ALTER TABLE sponsorships ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW();
      `);
      console.log('✅ Added updated_at column to sponsorships');
    }

    // Check current event count
    const eventCount = await db.execute(sql`SELECT COUNT(*) FROM events`);
    console.log(`\n📊 Current number of events in database: ${eventCount.rows[0].count}`);

    if (eventCount.rows[0].count === '0') {
      console.log('\n🌱 Database is empty, importing sample events...');

      // Import sample events
      const sampleEvents = [
        {
          name: 'KubeCon + CloudNativeCon North America 2025',
          link: 'https://events.linuxfoundation.org/kubecon-cloudnativecon-north-america/',
          start_date: '2025-11-18',
          end_date: '2025-11-21',
          location: 'Salt Lake City, UT',
          priority: 'high',
          type: 'conference',
          goal: ['speaking', 'sponsoring'],
          cfp_deadline: '2025-07-28',
          status: 'planning',
          notes: 'Major cloud native conference focusing on Kubernetes and CNCF projects',
          created_by_id: null
        },
        {
          name: 'Open Source Summit Europe 2025',
          link: 'https://events.linuxfoundation.org/open-source-summit-europe/',
          start_date: '2025-09-16',
          end_date: '2025-09-18',
          location: 'Vienna, Austria',
          priority: 'high',
          type: 'conference',
          goal: ['speaking', 'attending'],
          cfp_deadline: '2025-05-16',
          status: 'planning',
          notes: 'Premier open source conference in Europe',
          created_by_id: null
        },
        {
          name: 'DockerCon 2025',
          link: 'https://www.docker.com/dockercon/',
          start_date: '2025-05-19',
          end_date: '2025-05-21',
          location: 'Los Angeles, CA',
          priority: 'medium',
          type: 'conference',
          goal: ['sponsoring', 'attending'],
          cfp_deadline: '2025-02-15',
          status: 'planning',
          notes: 'Annual Docker conference for containerization and developer tools',
          created_by_id: null
        },
        {
          name: 'DevOps Days Seattle 2025',
          link: 'https://devopsdays.org/events/2025-seattle/',
          start_date: '2025-08-14',
          end_date: '2025-08-15',
          location: 'Seattle, WA',
          priority: 'medium',
          type: 'conference',
          goal: ['attending', 'speaking'],
          cfp_deadline: '2025-05-01',
          status: 'planning',
          notes: 'Community-driven DevOps conference',
          created_by_id: null
        },
        {
          name: 'All Things Open 2025',
          link: 'https://allthingsopen.org/',
          start_date: '2025-10-19',
          end_date: '2025-10-21',
          location: 'Raleigh, NC',
          priority: 'medium',
          type: 'conference',
          goal: ['speaking', 'attending'],
          cfp_deadline: '2025-06-30',
          status: 'planning',
          notes: 'Large open source conference covering technology, business, and community',
          created_by_id: null
        }
      ];

      for (const event of sampleEvents) {
        await db.insert(schema.events).values(event);
        console.log(`✅ Imported: ${event.name}`);
      }

      console.log(`\n🎉 Successfully imported ${sampleEvents.length} sample events!`);
    } else {
      console.log('✅ Events already exist in database');
    }

    // Final verification
    const finalEventCount = await db.execute(sql`SELECT COUNT(*) FROM events`);
    console.log(`\n📊 Final event count: ${finalEventCount.rows[0].count}`);

    // Show a sample of events
    const sampleEvents = await db.execute(sql`
      SELECT id, name, start_date, end_date, type, priority
      FROM events
      ORDER BY start_date
      LIMIT 5
    `);

    console.log('\n📋 Sample events:');
    sampleEvents.rows.forEach(event => {
      console.log(`- ${event.name} (${event.start_date} - ${event.end_date}) [${event.type}]`);
    });

    console.log('\n✅ Database schema fix and data import completed successfully!');
  } catch (error) {
    console.error('❌ Error during database schema fix:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the schema fix
fixDatabaseSchema().catch((err) => {
  console.error('Schema fix failed:', err);
  process.exit(1);
});