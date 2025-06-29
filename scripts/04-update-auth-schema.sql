-- Update users table to make email required and remove OAuth-specific fields
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL;

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- Update RLS policies to work with Supabase's built-in auth
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies for email/password auth
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Update stories policies
DROP POLICY IF EXISTS "Users can view own stories" ON stories;
DROP POLICY IF EXISTS "Users can create own stories" ON stories;
DROP POLICY IF EXISTS "Users can update own stories" ON stories;

CREATE POLICY "Users can view own stories" ON stories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own stories" ON stories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories" ON stories
    FOR UPDATE USING (auth.uid() = user_id);

-- Update scenes policies
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
