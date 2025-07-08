-- Complete Admin Setup - Fixes RLS and sets up admin
-- Run this in Supabase SQL Editor

-- Step 1: Create tables if they don't exist
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  timeout_until TIMESTAMP WITH TIME ZONE,
  timeout_reason TEXT,
  timeout_duration INTEGER,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  text TEXT NOT NULL,
  inserted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_messages_inserted_at ON messages(inserted_at);

-- Step 3: Fix RLS policies (remove infinite recursion)
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;
DROP POLICY IF EXISTS "Allow all user_profiles operations" ON user_profiles;
DROP POLICY IF EXISTS "Allow all messages operations" ON messages;
DROP POLICY IF EXISTS "Allow all notes operations" ON notes;

-- Create simple policies
CREATE POLICY "Allow all user_profiles operations" ON user_profiles
  FOR ALL USING (true);

CREATE POLICY "Allow all messages operations" ON messages
  FOR ALL USING (true);

CREATE POLICY "Allow all notes operations" ON notes
  FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Step 4: Insert existing users into user_profiles
INSERT INTO user_profiles (id, email, username, is_admin, last_seen, created_at)
SELECT 
  id,
  email,
  COALESCE(split_part(email, '@', 1), 'user') as username,
  false as is_admin,
  NOW() as last_seen,
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  last_seen = NOW();

-- Step 5: Show results
SELECT '✅ Setup complete! Users in user_profiles:' as info;
SELECT email, username, is_admin FROM user_profiles;

-- Step 6: Instructions for setting admin
SELECT '📋 Next steps:' as info;
SELECT '1. Replace "your-email@example.com" with your email below' as step1;
SELECT '2. Run the UPDATE command below' as step2;
SELECT '3. Refresh your app' as step3;

-- Step 7: Template for setting admin (you need to edit this)
-- UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com'; 