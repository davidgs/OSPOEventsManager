-- Add geographic fields to events table
-- This migration adds country, region, and continent fields to enable better geographic filtering

-- Add the new geographic columns
ALTER TABLE events ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS continent VARCHAR(50);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_region ON events(region);
CREATE INDEX IF NOT EXISTS idx_events_continent ON events(continent);

-- Create a function to automatically populate geographic data based on location
-- This will be used by the geolocation service
CREATE OR REPLACE FUNCTION update_event_geography()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called by the application when geolocation data is available
    -- For now, it's a placeholder that can be enhanced with actual geocoding logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to events table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_events_updated_at'
    ) THEN
        CREATE TRIGGER update_events_updated_at
            BEFORE UPDATE ON events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN events.country IS 'Country where the event takes place (e.g., "United States", "India", "Germany")';
COMMENT ON COLUMN events.region IS 'Geographic region or state/province (e.g., "California", "Maharashtra", "Bavaria")';
COMMENT ON COLUMN events.continent IS 'Continent where the event takes place (e.g., "North America", "Asia", "Europe")';
