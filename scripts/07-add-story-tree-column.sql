-- Add story_tree column to stories table
ALTER TABLE stories ADD COLUMN IF NOT EXISTS story_tree JSONB DEFAULT '{}';

-- Update existing stories to have empty story tree
UPDATE stories SET story_tree = '{}' WHERE story_tree IS NULL;
