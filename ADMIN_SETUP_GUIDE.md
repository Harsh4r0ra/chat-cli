# 🚀 Admin Panel Setup Guide

## Prerequisites
- You have a Supabase project set up
- Your app is running and you can log in

---

## Step 1: Set Up Database Tables

### 1.1 Go to Supabase Dashboard
1. Open your browser and go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### 1.2 Open SQL Editor
1. In the left sidebar, click **"SQL Editor"**
2. Click **"New query"** to create a new SQL script

### 1.3 Run the Database Setup Script
1. Copy the entire contents of `database_setup.sql`
2. Paste it into the SQL editor
3. Click **"Run"** button (or press Ctrl+Enter)

**Expected Result**: You should see "Success" message with no errors.

---

## Step 2: Set Up Admin User

### 2.1 Log Into Your App
1. Open your chat app in a new browser tab
2. Log in with your email address
3. Make sure you're successfully logged in

### 2.2 Open Browser Console
1. Press **F12** (or right-click → Inspect)
2. Click on the **"Console"** tab
3. Make sure you're on the console tab

### 2.3 Run Setup Script
1. Copy this entire script and paste it into the console:

```javascript
async function setupAdmin() {
  console.log('🚀 Starting admin setup...');
  
  try {
    // Check if supabase is available
    if (!window.supabase) {
      console.error('❌ Supabase not found. Please refresh the page and try again.');
      return;
    }

    // Check if user is logged in
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Please log in first, then run this script.');
      return;
    }

    console.log('✅ User logged in:', user.email);

    // Check if user_profiles table exists
    const { data, error } = await window.supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Database not set up. Please run the SQL script first.');
      console.log('📋 Go to Supabase → SQL Editor → Run database_setup.sql');
      return;
    }

    console.log('✅ Database tables exist');

    // Create or update user profile
    const { error: upsertError } = await window.supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
        is_admin: true,
        last_seen: new Date().toISOString()
      });

    if (upsertError) {
      console.error('❌ Error creating profile:', upsertError);
      return;
    }

    console.log('✅ Admin setup complete!');
    console.log('🔄 Please refresh the page to see the admin button.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupAdmin();
```

2. Press **Enter** to run the script
3. You should see success messages in the console

### 2.4 Refresh the Page
1. Refresh your browser page (F5 or Ctrl+R)
2. You should now see an **"admin"** button in the header

---

## Step 3: Verify Admin Panel

### 3.1 Test Admin Access
1. Click the **"admin"** button in the header
2. The admin panel should open as a modal
3. You should see statistics and user list

### 3.2 Test Features
1. **Statistics**: Should show user counts
2. **User List**: Should show your user and any others
3. **Block/Timeout**: Try blocking a test user

---

## Troubleshooting

### ❌ "Supabase not found" Error
**Solution**: Refresh the page and try again

### ❌ "Database not set up" Error
**Solution**: 
1. Go back to Supabase SQL Editor
2. Make sure you ran the `database_setup.sql` script
3. Check for any error messages in the SQL editor

### ❌ "User logged in" but no admin button
**Solution**:
1. Check browser console for any errors
2. Try running the setup script again
3. Make sure you refreshed the page after setup

### ❌ Admin button not visible
**Solution**:
1. Check that `is_admin = true` in database:
   ```sql
   SELECT * FROM user_profiles WHERE email = 'your-email@example.com';
   ```
2. If not true, run:
   ```sql
   UPDATE user_profiles SET is_admin = true WHERE email = 'your-email@example.com';
   ```

---

## Manual Database Check

If the setup script doesn't work, you can manually check:

### 1. Check if tables exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';
```

### 2. Check your user profile
```sql
SELECT * FROM user_profiles WHERE email = 'your-email@example.com';
```

### 3. Set admin manually
```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

---

## Alternative Quick Setup

If the above doesn't work, try this simplified approach:

1. **Run this in SQL Editor**:
```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert your user as admin (replace with your email)
INSERT INTO user_profiles (id, email, username, is_admin) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1),
  'your-email@example.com',
  'admin',
  true
) ON CONFLICT (id) DO UPDATE SET is_admin = true;
```

2. **Refresh your app** and the admin button should appear.

---

## Still Having Issues?

If you're still having trouble:

1. **Check browser console** for any JavaScript errors
2. **Check Supabase logs** for database errors
3. **Verify your Supabase URL and keys** are correct
4. **Try in incognito mode** to rule out cache issues

Let me know what specific error you're seeing and I can help troubleshoot! 