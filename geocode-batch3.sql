-- Batch 3: Final geocoding batch for remaining locations

BEGIN;

-- Europe
UPDATE events SET
  country = 'Finland',
  region = 'Uusimaa',
  continent = 'Europe'
WHERE location ILIKE '%helsinki%' AND country IS NULL;

UPDATE events SET
  country = 'Finland',
  region = 'Central Finland',
  continent = 'Europe'
WHERE location ILIKE '%jyväskylä%' AND country IS NULL;

UPDATE events SET
  country = 'Turkey',
  region = 'Istanbul',
  continent = 'Europe'
WHERE location ILIKE '%istanbul%' AND country IS NULL;

UPDATE events SET
  country = 'Greece',
  region = 'North Aegean',
  continent = 'Europe'
WHERE location ILIKE '%karlovasi%' AND country IS NULL;

UPDATE events SET
  country = 'Poland',
  region = 'Lesser Poland',
  continent = 'Europe'
WHERE location ILIKE '%kraków%' OR location ILIKE '%krakow%' AND country IS NULL;

UPDATE events SET
  country = 'Spain',
  region = 'Andalusia',
  continent = 'Europe'
WHERE location ILIKE '%málaga%' OR location ILIKE '%malaga%' AND country IS NULL;

UPDATE events SET
  country = 'United Kingdom',
  region = 'England',
  continent = 'Europe'
WHERE location ILIKE '%manchester%' AND country IS NULL;

UPDATE events SET
  country = 'Spain',
  region = 'Castile and León',
  continent = 'Europe'
WHERE location ILIKE '%ponferrada%' AND country IS NULL;

UPDATE events SET
  country = 'Czech Republic',
  region = 'Prague',
  continent = 'Europe'
WHERE location ILIKE '%prague%' AND country IS NULL;

UPDATE events SET
  country = 'Bulgaria',
  region = 'Sofia',
  continent = 'Europe'
WHERE location ILIKE '%sofia%' AND country IS NULL;

UPDATE events SET
  country = 'Germany',
  region = 'Lower Saxony',
  continent = 'Europe'
WHERE location ILIKE '%soltau%' AND country IS NULL;

UPDATE events SET
  country = 'Lithuania',
  region = 'Vilnius',
  continent = 'Europe'
WHERE location ILIKE '%vilnius%' AND country IS NULL;

-- Asia
UPDATE events SET
  country = 'Vietnam',
  region = 'Ho Chi Minh City',
  continent = 'Asia'
WHERE location ILIKE '%ho chi minh%' AND country IS NULL;

UPDATE events SET
  country = 'India',
  region = 'Telangana',
  continent = 'Asia'
WHERE location ILIKE '%hyderabad%' AND country IS NULL;

UPDATE events SET
  country = 'India',
  region = 'Maharashtra',
  continent = 'Asia'
WHERE location ILIKE '%pune%' AND country IS NULL;

UPDATE events SET
  country = 'Israel',
  region = 'Tel Aviv',
  continent = 'Asia'
WHERE location ILIKE '%tel aviv%' AND country IS NULL;

-- Africa
UPDATE events SET
  country = 'Uganda',
  region = 'Central Uganda',
  continent = 'Africa'
WHERE location ILIKE '%kampala%' AND country IS NULL;

UPDATE events SET
  country = 'Nigeria',
  region = 'Lagos',
  continent = 'Africa'
WHERE location ILIKE '%lagos%' AND country IS NULL;

-- North America
UPDATE events SET
  country = 'United States',
  region = 'Missouri',
  continent = 'North America'
WHERE location ILIKE '%kansas city%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'California',
  continent = 'North America'
WHERE location ILIKE '%long beach%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Florida',
  continent = 'North America'
WHERE location ILIKE '%orlando%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Oregon',
  continent = 'North America'
WHERE location ILIKE '%portland%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'North Carolina',
  continent = 'North America'
WHERE location ILIKE '%raleigh%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Virginia',
  continent = 'North America'
WHERE location ILIKE '%reston%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'California',
  continent = 'North America'
WHERE location ILIKE '%san diego%' AND country IS NULL;

UPDATE events SET
  country = 'United States',
  region = 'Missouri',
  continent = 'North America'
WHERE location ILIKE '%st. louis%' OR location ILIKE '%saint louis%' AND country IS NULL;

-- South America
UPDATE events SET
  country = 'Brazil',
  region = 'São Paulo',
  continent = 'South America'
WHERE location ILIKE '%sao paolo%' OR location ILIKE '%são paulo%' AND country IS NULL;

-- Show final results
SELECT
  COUNT(*) as total_events,
  COUNT(country) as events_with_country,
  COUNT(region) as events_with_region,
  COUNT(continent) as events_with_continent,
  COUNT(*) - COUNT(country) as still_need_geocoding,
  ROUND(COUNT(country)::numeric / COUNT(*)::numeric * 100, 1) as percent_complete
FROM events;

-- Show any remaining ungeocode locations
SELECT location, COUNT(*) as event_count
FROM events
WHERE country IS NULL
GROUP BY location
ORDER BY location;

COMMIT;
