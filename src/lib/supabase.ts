import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ceqxtgnnqrgbdtkslfis.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlcXh0Z25ucXJnYmR0a3NsZmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzk2ODAsImV4cCI6MjA4ODc1NTY4MH0.Dm8BphCXrZKpzLGNSmA3XMf3K7FcunCUaviD-OCf4HM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set — auth and database features will not work.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
