-- Batch 2: Geocoding for remaining common locations

BEGIN;

-- Africa
UPDATE events SET
  country = 'Ghana',
  region = 'Greater Accra',
  continent = 'Africa'
WHERE location ILIKE '%accra%' AND country IS NULL;

UPDATE events SET
  country = 'South Africa',
  region = 'Western Cape',
  continent = 'Africa'
WHERE location ILIKE '%cape town%' AND country IS NULL;

-- North America
UPDATE events SET
  country = 'United States',
  region = 'Georgia',
  continent = 'North America'
WHERE location ILIKE '%atlanta%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Massachusetts',
  continent = 'North America'
WHERE location ILIKE '%boston%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Montana',
  continent = 'North America'
WHERE location ILIKE '%bozeman%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Vermont',
  continent = 'North America'
WHERE location ILIKE '%burlington%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Texas',
  continent = 'North America'
WHERE location ILIKE '%frisco%' AND country IS NULL;

-- Europe
UPDATE events SET
  country = 'Italy',
  region = 'Emilia-Romagna',
  continent = 'Europe'
WHERE location ILIKE '%bologna%' AND country IS NULL;

UPDATE events SET
  country = 'Belgium',
  region = 'Brussels-Capital',
  continent = 'Europe'
WHERE location ILIKE '%brussels%' AND country IS NULL;

UPDATE events SET
  country = 'Denmark',
  region = 'Capital Region',
  continent = 'Europe'
WHERE location ILIKE '%copenhagen%' AND country IS NULL;

UPDATE events SET
  country = 'Ireland',
  region = 'Leinster',
  continent = 'Europe'
WHERE location ILIKE '%dublin%' AND country IS NULL;

UPDATE events SET
  country = 'Netherlands',
  region = 'North Brabant',
  continent = 'Europe'
WHERE location ILIKE '%eindhoven%' AND country IS NULL;

UPDATE events SET
  country = 'Germany',
  region = 'Hesse',
  continent = 'Europe'
WHERE location ILIKE '%frankfurt%' AND country IS NULL;

UPDATE events SET
  country = 'Switzerland',
  region = 'Geneva',
  continent = 'Europe'
WHERE location ILIKE '%geneva%' AND country IS NULL;

UPDATE events SET
  country = 'Belgium',
  region = 'East Flanders',
  continent = 'Europe'
WHERE location ILIKE '%ghent%' AND country IS NULL;

-- Asia
UPDATE events SET
  country = 'Philippines',
  region = 'Central Visayas',
  continent = 'Asia'
WHERE location ILIKE '%cebu%' AND country IS NULL;

UPDATE events SET
  country = 'India',
  region = 'Tamil Nadu',
  continent = 'Asia'
WHERE location ILIKE '%chennai%' AND country IS NULL;

UPDATE events SET
  country = 'United Arab Emirates',
  region = 'Dubai',
  continent = 'Asia'
WHERE location ILIKE '%dubai%' AND country IS NULL;

-- South America
UPDATE events SET
  country = 'Mexico',
  region = 'Mexico City',
  continent = 'North America'
WHERE location ILIKE '%ciudad de méxico%' OR location ILIKE '%mexico city%' AND country IS NULL;

UPDATE events SET
  country = 'Argentina',
  region = 'Córdoba',
  continent = 'South America'
WHERE location ILIKE '%córdoba%' OR location ILIKE '%cordoba%' AND country IS NULL;

-- Show results
SELECT
  COUNT(*) as total_events,
  COUNT(country) as events_with_country,
  COUNT(region) as events_with_region,
  COUNT(continent) as events_with_continent,
  COUNT(*) - COUNT(country) as still_need_geocoding
FROM events;

COMMIT;

