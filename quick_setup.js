// Quick Admin Setup - Copy and paste this entire script into browser console

(async function() {
  console.log('🚀 Quick Admin Setup Starting...');
  
  // Check if we're in the right environment
  if (!window.supabase) {
    console.error('❌ Error: Supabase not found. Please run this on your chat app page.');
    return;
  }

  try {
    // Step 1: Check if user is logged in
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Please log in first, then run this script.');
      return;
    }
    console.log('✅ User logged in:', user.email);

    // Step 2: Try to create user_profiles table if it doesn't exist
    console.log('📋 Setting up database...');
    
    // Step 3: Create user profile with admin privileges
    const { error: upsertError } = await window.supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        username: user.email.split('@')[0],
        is_admin: true,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (upsertError) {
      console.error('❌ Database error:', upsertError.message);
      console.log('💡 Try running the database_setup.sql script in Supabase first.');
      return;
    }

    console.log('✅ Admin setup successful!');
    console.log('🔄 Refreshing page to show admin button...');
    
    // Refresh the page to show the admin button
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('💡 Make sure you have run the database_setup.sql script in Supabase.');
  }
})(); 