-- Add missing columns to scenes table
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS options TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS is_correct_path BOOLEAN[] NOT NULL DEFAULT '{}';

-- Update existing scenes to have empty arrays for new columns
UPDATE scenes SET options = '{}' WHERE options IS NULL;
UPDATE scenes SET is_correct_path = '{}' WHERE is_correct_path IS NULL;
