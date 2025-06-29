-- Add the missing is_main_path column to scenes table
ALTER TABLE scenes ADD COLUMN IF NOT EXISTS is_main_path BOOLEAN DEFAULT TRUE;

-- Update existing scenes to be main path by default
UPDATE scenes SET is_main_path = TRUE WHERE is_main_path IS NULL;
