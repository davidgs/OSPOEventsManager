#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { events } from '../shared/database-schema';
import { isNull, or, limit } from 'drizzle-orm';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Test geocoding on just 3 events to verify it works
async function testGeocode() {
  console.log('🧪 Testing geocoding on sample events...\n');

  // Connect to database
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or POSTGRES_URL found in environment variables');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Get 3 sample events that need geocoding
    const sampleEvents = await db
      .select()
      .from(events)
      .where(
        or(
          isNull(events.country),
          isNull(events.region),
          isNull(events.continent)
        )
      )
      .limit(3);

    console.log(`📊 Sample events to test geocoding:\n`);

    for (const event of sampleEvents) {
      console.log(`🎪 Event: ${event.name}`);
      console.log(`📍 Location: "${event.location}"`);
      console.log(`🌍 Current: Country="${event.country}", Region="${event.region}", Continent="${event.continent}"`);
      console.log('---');
    }

    console.log(`\n✅ Found ${sampleEvents.length} events for testing`);
    console.log(`\n💡 To run the full geocoding process:`);
    console.log(`   npm run geocode`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testGeocode().catch(console.error);
}
