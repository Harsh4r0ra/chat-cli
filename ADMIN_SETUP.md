# Admin Panel Setup Guide

## Overview
The admin panel allows administrators to manage users, view statistics, and moderate the chat application.

## Features
- **User Statistics**: View total users, active users, total messages, and blocked users
- **User Management**: Block/unblock users, timeout users with custom durations
- **Real-time Updates**: See user status changes in real-time
- **Moderation Tools**: Set timeouts with reasons and custom durations

## Database Setup

1. **Run the SQL Script**
   Execute the `database_setup.sql` file in your Supabase SQL editor to create the necessary tables and policies.

2. **Set Up Admin User**
   After running the SQL script, you need to manually set your user as an admin:
   ```sql
   UPDATE user_profiles 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```

## How to Use

### Accessing the Admin Panel
1. Log in to the application with your admin account
2. Click the "admin" button in the header (only visible to admins)
3. The admin panel will open as a modal overlay

### User Management
- **View Users**: See all registered users with their email, join date, and last seen time
- **Block Users**: Click "Block" to permanently block a user from sending messages
- **Unblock Users**: Click "Unblock" to restore access for blocked users
- **Timeout Users**: Click "Timeout" to temporarily restrict a user's access
- **Remove Timeout**: Click "Remove Timeout" to end a user's timeout early

### Timeout System
- **Duration Options**: 5 minutes, 15 minutes, 30 minutes, 1 hour, 2 hours, 4 hours, 24 hours
- **Reason Required**: Must provide a reason for the timeout
- **Automatic Expiration**: Timeouts automatically expire after the set duration
- **Manual Removal**: Admins can remove timeouts before they expire

### Statistics
- **Total Users**: Number of registered users
- **Active Users**: Users who have been active in the last 24 hours
- **Total Messages**: Total number of messages sent
- **Blocked Users**: Number of currently blocked users

## Security Features

### Row Level Security (RLS)
- Users can only view and update their own profiles
- Admins can view and update all user profiles
- Messages are visible to everyone but only authenticated users can send them
- Notes are publicly accessible

### Admin Detection
- The system checks if the current user has `is_admin = true` in their profile
- Admin features are only available to verified admin users
- Admin status is checked on each page load

## User Experience

### Blocked Users
- Cannot send messages
- See error message: "Your account has been blocked by an administrator"
- Can still view the chat but cannot participate

### Timed Out Users
- Cannot send messages until timeout expires
- See error message with remaining time: "You are currently timed out. Time remaining: X minutes"
- Can still view the chat but cannot participate

### Visual Indicators
- Blocked users have red borders and "BLOCKED" status
- Timed out users have orange borders and "TIMED OUT" status
- Admin panel shows real-time status updates

## Troubleshooting

### Admin Button Not Visible
1. Check that your user has `is_admin = true` in the database
2. Refresh the page to reload admin status
3. Check browser console for any errors

### Cannot Block/Timeout Users
1. Ensure you have admin privileges
2. Check that the user_profiles table exists and has the correct structure
3. Verify RLS policies are properly set up

### Statistics Not Updating
1. Check that the database triggers are working
2. Verify that the `last_seen` field is being updated
3. Check for any database connection issues

## Database Schema

### user_profiles Table
```sql
- id (UUID, Primary Key)
- email (TEXT)
- username (TEXT)
- is_admin (BOOLEAN, default: false)
- is_blocked (BOOLEAN, default: false)
- blocked_at (TIMESTAMP)
- blocked_reason (TEXT)
- timeout_until (TIMESTAMP)
- timeout_reason (TEXT)
- timeout_duration (INTEGER, seconds)
- last_seen (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### Required Indexes
- `idx_user_profiles_email`
- `idx_user_profiles_is_admin`
- `idx_user_profiles_is_blocked`
- `idx_user_profiles_timeout_until`

## API Endpoints Used

The admin panel uses the following Supabase operations:
- `SELECT` from `user_profiles` for user lists and statistics
- `UPDATE` on `user_profiles` for blocking/unblocking and timeouts
- `COUNT` queries for statistics
- Real-time subscriptions for live updates

## Styling

The admin panel uses the same glassmorphism design as the main application:
- Glass-like backgrounds with blur effects
- Subtle gradients and shadows
- Smooth animations and hover effects
- Responsive design for mobile devices 