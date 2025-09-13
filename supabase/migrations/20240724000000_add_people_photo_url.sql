-- Add photo_url column to people table
ALTER TABLE people ADD COLUMN IF NOT EXISTS photo_url text;
