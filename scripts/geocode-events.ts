#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { events } from '../shared/database-schema';
import { eq, isNull, or } from 'drizzle-orm';

// Load environment variables (works in both local and cluster environments)
import dotenv from 'dotenv';
dotenv.config();

// Geocoding service interface
interface GeocodeResult {
  country: string | null;
  region: string | null;
  continent: string | null;
  confidence: number;
}

// Continent mapping based on country
const continentMapping: Record<string, string> = {
  // Asia
  'Japan': 'Asia',
  'China': 'Asia',
  'India': 'Asia',
  'Singapore': 'Asia',
  'Thailand': 'Asia',
  'Malaysia': 'Asia',
  'Indonesia': 'Asia',
  'Philippines': 'Asia',
  'Vietnam': 'Asia',
  'South Korea': 'Asia',
  'Taiwan': 'Asia',
  'Hong Kong': 'Asia',
  'Israel': 'Asia',
  'United Arab Emirates': 'Asia',
  'Saudi Arabia': 'Asia',

  // Europe
  'United Kingdom': 'Europe',
  'UK': 'Europe',
  'France': 'Europe',
  'Germany': 'Europe',
  'Netherlands': 'Europe',
  'Spain': 'Europe',
  'Italy': 'Europe',
  'Sweden': 'Europe',
  'Norway': 'Europe',
  'Denmark': 'Europe',
  'Belgium': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'Poland': 'Europe',
  'Czech Republic': 'Europe',
  'Finland': 'Europe',
  'Ireland': 'Europe',
  'Portugal': 'Europe',
  'Greece': 'Europe',
  'Russia': 'Europe',

  // North America
  'United States': 'North America',
  'USA': 'North America',
  'US': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',

  // South America
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Colombia': 'South America',
  'Peru': 'South America',
  'Venezuela': 'South America',
  'Ecuador': 'South America',
  'Uruguay': 'South America',
  'Paraguay': 'South America',
  'Bolivia': 'South America',
  'Guyana': 'South America',
  'Suriname': 'South America',

  // Africa
  'South Africa': 'Africa',
  'Nigeria': 'Africa',
  'Kenya': 'Africa',
  'Egypt': 'Africa',
  'Morocco': 'Africa',
  'Ghana': 'Africa',
  'Ethiopia': 'Africa',
  'Tanzania': 'Africa',
  'Uganda': 'Africa',
  'Zimbabwe': 'Africa',
  'Botswana': 'Africa',
  'Namibia': 'Africa',
  'Zambia': 'Africa',
  'Rwanda': 'Africa',

  // Oceania
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'Fiji': 'Oceania',
  'Papua New Guinea': 'Oceania',
  'Samoa': 'Oceania',
  'Tonga': 'Oceania',
  'Vanuatu': 'Oceania',
};

// Free geocoding service using OpenStreetMap Nominatim
async function geocodeLocation(location: string): Promise<GeocodeResult> {
  try {
    console.log(`🔍 Geocoding: "${location}"`);

    // Clean up the location string
    const cleanLocation = location.trim().replace(/\s+/g, ' ');

    // Use Nominatim (free OpenStreetMap geocoding service)
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=1&q=${encodeURIComponent(cleanLocation)}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OSPOEventsManager/1.0 (geocoding script)'
      }
    });

    if (!response.ok) {
      console.warn(`⚠️  Geocoding API error for "${location}": ${response.status}`);
      return { country: null, region: null, continent: null, confidence: 0 };
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn(`⚠️  No geocoding results for "${location}"`);
      return { country: null, region: null, continent: null, confidence: 0 };
    }

    const result = data[0];
    const address = result.address || {};

    // Extract country
    let country = address.country || null;

    // Extract region/state
    let region = address.state || address.province || address.region || null;

    // Determine continent
    let continent = null;
    if (country) {
      continent = continentMapping[country] || null;

      // If no direct match, try some common variations
      if (!continent) {
        const countryLower = country.toLowerCase();
        if (countryLower.includes('united states') || countryLower.includes('usa')) {
          continent = 'North America';
          country = 'United States';
        } else if (countryLower.includes('united kingdom') || countryLower.includes('uk')) {
          continent = 'Europe';
          country = 'United Kingdom';
        }
      }
    }

    const confidence = parseFloat(result.importance || '0') * 100;

    console.log(`✅ Geocoded "${location}" → Country: ${country}, Region: ${region}, Continent: ${continent} (confidence: ${confidence.toFixed(1)}%)`);

    return {
      country,
      region,
      continent,
      confidence
    };

  } catch (error) {
    console.error(`❌ Error geocoding "${location}":`, error);
    return { country: null, region: null, continent: null, confidence: 0 };
  }
}

// Add delay to respect rate limits
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🌍 Starting geocoding process for events...\n');

  // Connect to database
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ No DATABASE_URL or POSTGRES_URL found in environment variables');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    // Get all events that need geocoding (missing country, region, or continent)
    const eventsToGeocode = await db
      .select()
      .from(events)
      .where(
        or(
          isNull(events.country),
          isNull(events.region),
          isNull(events.continent)
        )
      );

    console.log(`📊 Found ${eventsToGeocode.length} events that need geocoding\n`);

    if (eventsToGeocode.length === 0) {
      console.log('✅ All events already have geographic data!');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < eventsToGeocode.length; i++) {
      const event = eventsToGeocode[i];
      console.log(`\n[${i + 1}/${eventsToGeocode.length}] Processing: ${event.name}`);
      console.log(`📍 Location: "${event.location}"`);

      // Skip if location is empty or too vague
      if (!event.location || event.location.trim().length < 3) {
        console.log(`⏭️  Skipping - location too vague: "${event.location}"`);
        failureCount++;
        continue;
      }

      // Geocode the location
      const geocodeResult = await geocodeLocation(event.location);

      if (geocodeResult.country || geocodeResult.region || geocodeResult.continent) {
        // Update the event with geocoded data
        try {
          await db
            .update(events)
            .set({
              country: geocodeResult.country,
              region: geocodeResult.region,
              continent: geocodeResult.continent,
              updated_at: new Date()
            })
            .where(eq(events.id, event.id));

          console.log(`💾 Updated event ${event.id} with geocoded data`);
          successCount++;

        } catch (updateError) {
          console.error(`❌ Failed to update event ${event.id}:`, updateError);
          failureCount++;
        }
      } else {
        console.log(`❌ No geocoding data found for "${event.location}"`);
        failureCount++;
      }

      // Rate limiting - wait 1 second between requests to be respectful
      if (i < eventsToGeocode.length - 1) {
        console.log('⏳ Waiting 1 second...');
        await delay(1000);
      }
    }

    console.log('\n🎉 Geocoding process completed!');
    console.log(`✅ Successfully geocoded: ${successCount} events`);
    console.log(`❌ Failed to geocode: ${failureCount} events`);
    console.log(`📊 Total processed: ${eventsToGeocode.length} events`);

  } catch (error) {
    console.error('❌ Fatal error during geocoding:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
