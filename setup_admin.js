// Admin Setup Script
// Run this in your browser console after setting up the database

async function setupAdmin() {
  const { supabase } = window;
  
  if (!supabase) {
    console.error('Supabase not found. Make sure you\'re running this in the app.');
    return;
  }

  try {
    // First, check if user_profiles table exists
    const { data: tables, error: tableError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ user_profiles table does not exist. Please run the database_setup.sql script first.');
      console.log('📋 Steps to fix:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Go to SQL Editor');
      console.log('3. Copy and paste the contents of database_setup.sql');
      console.log('4. Run the script');
      console.log('5. Then run this setup script again');
      return;
    }

    console.log('✅ user_profiles table exists');

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No user logged in. Please log in first.');
      return;
    }

    console.log('👤 Current user:', user.email);

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('📝 Creating user profile...');
      
      // Create user profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: user.email.split('@')[0],
          is_admin: false,
          last_seen: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating user profile:', insertError);
        return;
      }

      console.log('✅ User profile created');
    } else {
      console.log('✅ User profile already exists');
    }

    // Set user as admin
    console.log('🔧 Setting user as admin...');
    
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_admin: true })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error setting admin status:', updateError);
      return;
    }

    console.log('✅ User set as admin successfully!');
    console.log('🔄 Please refresh the page to see the admin button.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Instructions
console.log('🚀 Admin Setup Script');
console.log('📋 Instructions:');
console.log('1. Make sure you\'re logged into the app');
console.log('2. Run the database_setup.sql script in Supabase first');
console.log('3. Then run: setupAdmin()');
console.log('');
console.log('To run the setup, type: setupAdmin()'); 