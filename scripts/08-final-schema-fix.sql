-- Final database schema that matches the current API implementation
-- Run this to ensure the database matches what the API expects

-- Drop the redesigned tables if they exist
DROP TABLE IF EXISTS scene_images CASCADE;

-- Ensure scenes table has the correct structure for current API
DROP TABLE IF EXISTS scenes CASCADE;
CREATE TABLE scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    scene_key VARCHAR(50) NOT NULL, -- e.g., 'a_1', 'b_1', etc.
    text TEXT[] NOT NULL,
    image_prompt TEXT NOT NULL,
    image_url TEXT,
    options TEXT[] NOT NULL DEFAULT '{}',
    selected_option TEXT,
    is_correct_path BOOLEAN[] NOT NULL DEFAULT '{}',
    is_game_over BOOLEAN DEFAULT FALSE,
    is_main_path BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure stories table doesn't have story_tree column (API doesn't use it)
ALTER TABLE stories DROP COLUMN IF EXISTS story_tree;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scenes_story_id ON scenes(story_id);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_key ON scenes(story_id, scene_key);
CREATE INDEX IF NOT EXISTS idx_scenes_scene_number ON scenes(scene_number);

-- Enable RLS
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Update scenes policies to match auth patterns
DROP POLICY IF EXISTS "Users can view scenes from own stories" ON scenes;
DROP POLICY IF EXISTS "Users can create scenes for own stories" ON scenes;
DROP POLICY IF EXISTS "Users can update scenes from own stories" ON scenes;

CREATE POLICY "Users can view scenes from own stories" ON scenes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scenes.story_id 
            AND stories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create scenes for own stories" ON scenes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scenes.story_id 
            AND stories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scenes from own stories" ON scenes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scenes.story_id 
            AND stories.user_id = auth.uid()
        )
    );

-- Service role policies (for API access)
CREATE POLICY "Service role can manage all scenes" ON scenes
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all stories" ON stories
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );

CREATE POLICY "Service role can manage all users" ON users
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'service_role'
    );
