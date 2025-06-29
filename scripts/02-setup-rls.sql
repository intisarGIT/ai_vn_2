-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Stories policies
CREATE POLICY "Users can view own stories" ON stories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
    FOR UPDATE USING (auth.uid() = user_id);

-- Scenes policies
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
