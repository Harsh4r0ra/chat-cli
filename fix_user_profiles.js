// Fix User Profiles - Copy and paste this into browser console

(async function() {
  console.log('🔧 Fixing user profiles table...');
  
  if (!window.supabase) {
    console.error('❌ Supabase not found. Please run this on your chat app page.');
    return;
  }

  try {
    // Get current user
    const { data: { user } } = await window.supabase.auth.getUser();
    if (!user) {
      console.error('❌ Please log in first.');
      return;
    }

    console.log('👤 Current user:', user.email);

    // Check if user_profiles table exists and has data
    const { data: profiles, error: profilesError } = await window.supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ user_profiles table error:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} user profiles`);

    // Create profile for current user if it doesn't exist
    const existingProfile = profiles.find(p => p.id === user.id);
    
    if (!existingProfile) {
      console.log('📝 Creating profile for current user...');
      
      const { error: insertError } = await window.supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          email: user.email,
          username: user.email.split('@')[0],
          is_admin: true, // Make current user admin
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Error creating profile:', insertError);
        return;
      }

      console.log('✅ Profile created successfully!');
    } else {
      console.log('✅ Profile already exists, updating admin status...');
      
      // Update existing profile to make user admin
      const { error: updateError } = await window.supabase
        .from('user_profiles')
        .update({ 
          is_admin: true,
          last_seen: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError);
        return;
      }

      console.log('✅ Profile updated successfully!');
    }

    console.log('🔄 Refreshing page to show admin button...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
})(); 