/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
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

// Function to parse dates from CSV format to YYYY-MM-DD
function parseCSVDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return '';
  }

  // Handle format like "Fri, Jun 6" or "Wed, Jun 11"
  const cleanDate = dateStr.replace(/"/g, '').trim();

  // Extract month and day
  const parts = cleanDate.split(',');
  if (parts.length !== 2) {
    console.warn(`Unexpected date format: ${dateStr}`);
    return '';
  }

  const monthDay = parts[1].trim();
  const [monthStr, dayStr] = monthDay.split(' ');

  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };

  const month = monthMap[monthStr];
  if (!month) {
    console.warn(`Unknown month: ${monthStr}`);
    return '';
  }

  const day = dayStr.padStart(2, '0');

  // Determine year based on month (assuming events are in 2025 or 2026)
  let year = '2025';
  if (['Jan', 'Feb', 'Mar'].includes(monthStr)) {
    year = '2026';
  }

  return `${year}-${month}-${day}`;
}

// Function to determine event type from name
function getEventType(eventName: string): string {
  const name = eventName.toLowerCase();

  if (name.includes('conf') || name.includes('summit') || name.includes('expo')) {
    return 'conference';
  } else if (name.includes('meetup')) {
    return 'meetup';
  } else if (name.includes('webinar')) {
    return 'webinar';
  } else if (name.includes('workshop')) {
    return 'workshop';
  } else if (name.includes('hackathon')) {
    return 'hackathon';
  } else {
    return 'conference'; // Default
  }
}

// Function to determine priority
function getPriority(priorityStr: string): string {
  if (!priorityStr || priorityStr.trim() === '') {
    return 'medium'; // Default
  }

  const priority = priorityStr.toLowerCase();
  if (priority.includes('essential') || priority.includes('high')) {
    return 'high';
  } else if (priority.includes('medium') || priority.includes('nice')) {
    return 'medium';
  } else {
    return 'low';
  }
}

// Function to determine event goals
function getEventGoals(eventName: string, notes: string): string[] {
  const combinedText = `${eventName} ${notes}`.toLowerCase();
  const goals: string[] = [];

  if (combinedText.includes('cfp') || combinedText.includes('speak') || combinedText.includes('submit')) {
    goals.push('speaking');
  }
  if (combinedText.includes('sponsor') || combinedText.includes('booth')) {
    goals.push('sponsoring');
  }
  if (combinedText.includes('attend') || combinedText.includes('go to')) {
    goals.push('attending');
  }
  if (combinedText.includes('exhibit')) {
    goals.push('exhibiting');
  }

  // Default to attending if no specific goals detected
  if (goals.length === 0) {
    goals.push('attending');
  }

  return goals;
}

async function importCSVEvents() {
  console.log('Starting CSV import...');

  // Read and parse CSV file
  const csvFilePath = process.env.CSV_FILE_PATH || 'OSPO AI Community team targeted events CY25 (2H) - CY26 - AI target events.csv';
  const csvContent = readFileSync(csvFilePath, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  console.log(`Found ${records.length} events in CSV file`);

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

  // Process each event
  const events = [];
  for (const record of records) {
    const startDate = parseCSVDate(record['Event start date']);
    const endDate = parseCSVDate(record['Event end date']);

    if (!startDate || !endDate) {
      console.warn(`Skipping event "${record['Event Name']}" - invalid dates`);
      continue;
    }

    const cfpDeadline = record['CFP deadline'] ? parseCSVDate(record['CFP deadline']) : null;

    const event = {
      name: record['Event Name'],
      link: `https://example.com/events/${record['Event Name'].toLowerCase().replace(/\s+/g, '-')}`, // Placeholder link
      start_date: startDate,
      end_date: endDate,
      location: record['Location'] || 'TBD',
      priority: getPriority(record['Priority']),
      type: getEventType(record['Event Name']),
      goal: getEventGoals(record['Event Name'], record['Notes'] || ''),
      cfp_deadline: cfpDeadline,
      status: 'planning',
      notes: record['Notes'] || null,
      created_by_id: null // Will be set to actual user ID if available
    };

    events.push(event);
    console.log(`Processed: ${event.name} (${event.start_date} - ${event.end_date})`);
  }

  console.log(`\nImporting ${events.length} events to database...`);

  try {
    for (const event of events) {
      await db.insert(schema.events).values(event);
      console.log(`✅ Imported: ${event.name}`);
    }

    console.log(`\n🎉 Successfully imported ${events.length} events!`);
  } catch (err) {
    console.error('❌ Error importing events:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import
importCSVEvents().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});