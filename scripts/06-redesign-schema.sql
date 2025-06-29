-- Drop existing tables and recreate with better structure
DROP TABLE IF EXISTS scenes CASCADE;
DROP TABLE IF EXISTS stories CASCADE;

-- Recreate stories table with pre-generation support
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    genre VARCHAR(100) NOT NULL,
    total_scenes INTEGER NOT NULL,
    current_scene INTEGER DEFAULT 1,
    x_meter INTEGER DEFAULT 100,
    x_meter_type VARCHAR(50) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    is_victory BOOLEAN DEFAULT FALSE,
    story_tree JSONB NOT NULL, -- Pre-generated story content
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate scenes table for image storage
CREATE TABLE scene_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    scene_key VARCHAR(10) NOT NULL, -- 'a_1', 'b_1', etc.
    image_url TEXT,
    image_prompt TEXT NOT NULL,
    is_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id_new ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_scene_images_story_id ON scene_images(story_id);
CREATE INDEX IF NOT EXISTS idx_scene_images_scene_key ON scene_images(story_id, scene_key);

-- Update RLS policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_images ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Users can view own stories" ON stories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
    FOR UPDATE USING (auth.uid() = user_id);

-- Scene images policies
CREATE POLICY "Users can view scene images from own stories" ON scene_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scene_images.story_id 
            AND stories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create scene images for own stories" ON scene_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scene_images.story_id 
            AND stories.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update scene images from own stories" ON scene_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM stories 
            WHERE stories.id = scene_images.story_id 
            AND stories.user_id = auth.uid()
        )
    );
