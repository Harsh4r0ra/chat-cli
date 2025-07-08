-- Fix User Profiles Table
-- This script will populate user_profiles with existing users

-- First, let's see what users exist in auth.users
SELECT 'Current auth.users:' as info;
SELECT id, email, created_at FROM auth.users;

-- Insert all existing users into user_profiles
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

-- Show the results
SELECT 'User profiles after fix:' as info;
SELECT id, email, username, is_admin, created_at FROM user_profiles;

-- Set your user as admin (replace 'your-email@example.com' with your actual email)
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';

-- Show final result
SELECT 'Admin users:' as info;
SELECT email, is_admin FROM user_profiles WHERE is_admin = true; 