import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'terminal-chat-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Expose supabase globally for setup scripts
if (typeof window !== 'undefined') {
  window.supabase = supabase;
} 