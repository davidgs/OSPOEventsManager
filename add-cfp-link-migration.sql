-- Migration: Add cfp_link field to events table
-- This adds a new optional field for CFP submission links, separate from the main event link

ALTER TABLE events ADD COLUMN cfp_link TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN events.cfp_link IS 'URL for Call for Papers/Proposals submission, separate from main event link';