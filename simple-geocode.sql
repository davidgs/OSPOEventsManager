-- Simple geocoding update script for common locations
-- This manually maps known locations to their geographic data

BEGIN;

-- Update events with known geographic mappings
UPDATE events SET
  country = 'United Kingdom',
  region = 'England',
  continent = 'Europe'
WHERE location ILIKE '%london%' AND country IS NULL;

UPDATE events SET
  country = 'France',
  region = 'Île-de-France',
  continent = 'Europe'
WHERE location ILIKE '%paris%' AND country IS NULL;

UPDATE events SET
  country = 'Italy',
  region = 'Lombardy',
  continent = 'Europe'
WHERE location ILIKE '%milan%' AND country IS NULL;

UPDATE events SET
  country = 'Australia',
  region = 'Western Australia',
  continent = 'Oceania'
WHERE location ILIKE '%perth%' AND country IS NULL;

UPDATE events SET
  country = 'Morocco',
  region = 'Casablanca-Settat',
  continent = 'Africa'
WHERE location ILIKE '%casablanca%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Colorado',
  continent = 'North America'
WHERE location ILIKE '%denver%' AND country IS NULL;

UPDATE events SET
  country = 'Germany',
  region = 'Bavaria',
  continent = 'Europe'
WHERE location ILIKE '%munich%' AND country IS NULL;

UPDATE events SET
  country = 'Germany',
  region = 'Berlin',
  continent = 'Europe'
WHERE location ILIKE '%berlin%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'California',
  continent = 'North America'
WHERE location ILIKE '%san francisco%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'California',
  continent = 'North America'
WHERE location ILIKE '%san jose%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'New York',
  continent = 'North America'
WHERE location ILIKE '%new york%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Washington',
  continent = 'North America'
WHERE location ILIKE '%seattle%' AND country IS NULL;

UPDATE events SET
  country = 'Canada',
  region = 'Ontario',
  continent = 'North America'
WHERE location ILIKE '%toronto%' AND country IS NULL;

UPDATE events SET
  country = 'Canada',
  region = 'British Columbia',
  continent = 'North America'
WHERE location ILIKE '%vancouver%' AND country IS NULL;

UPDATE events SET
  country = 'Japan',
  region = 'Tokyo',
  continent = 'Asia'
WHERE location ILIKE '%tokyo%' AND country IS NULL;

UPDATE events SET
  country = 'Singapore',
  region = 'Singapore',
  continent = 'Asia'
WHERE location ILIKE '%singapore%' AND country IS NULL;

UPDATE events SET
  country = 'India',
  region = 'Karnataka',
  continent = 'Asia'
WHERE location ILIKE '%bangalore%' AND country IS NULL;

UPDATE events SET
  country = 'India',
  region = 'Maharashtra',
  continent = 'Asia'
WHERE location ILIKE '%mumbai%' AND country IS NULL;

UPDATE events SET
  country = 'China',
  region = 'Beijing',
  continent = 'Asia'
WHERE location ILIKE '%beijing%' AND country IS NULL;

UPDATE events SET
  country = 'China',
  region = 'Shanghai',
  continent = 'Asia'
WHERE location ILIKE '%shanghai%' AND country IS NULL;

UPDATE events SET
  country = 'South Korea',
  region = 'Seoul',
  continent = 'Asia'
WHERE location ILIKE '%seoul%' AND country IS NULL;

UPDATE events SET
  country = 'Netherlands',
  region = 'North Holland',
  continent = 'Europe'
WHERE location ILIKE '%amsterdam%' AND country IS NULL;

UPDATE events SET
  country = 'Spain',
  region = 'Madrid',
  continent = 'Europe'
WHERE location ILIKE '%madrid%' AND country IS NULL;

UPDATE events SET
  country = 'Spain',
  region = 'Catalonia',
  continent = 'Europe'
WHERE location ILIKE '%barcelona%' AND country IS NULL;

UPDATE events SET
  country = 'Sweden',
  region = 'Stockholm',
  continent = 'Europe'
WHERE location ILIKE '%stockholm%' AND country IS NULL;

UPDATE events SET
  country = 'Brazil',
  region = 'São Paulo',
  continent = 'South America'
WHERE location ILIKE '%são paulo%' OR location ILIKE '%sao paulo%' AND country IS NULL;

UPDATE events SET
  country = 'Brazil',
  region = 'Rio de Janeiro',
  continent = 'South America'
WHERE location ILIKE '%rio de janeiro%' AND country IS NULL;

-- Show results
SELECT
  COUNT(*) as total_events,
  COUNT(country) as events_with_country,
  COUNT(region) as events_with_region,
  COUNT(continent) as events_with_continent,
  COUNT(*) - COUNT(country) as still_need_geocoding
FROM events;

-- Show sample of updated events
SELECT id, name, location, country, region, continent
FROM events
WHERE country IS NOT NULL
ORDER BY id
LIMIT 10;

COMMIT;
