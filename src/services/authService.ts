import supabase from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export async function signUp(
  email: string,
  password: string,
  metadata: { company_name: string; contact_name: string }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        company_name: metadata.company_name,
        contact_name: metadata.contact_name,
        role: 'client',
      },
    },
  });
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email);
}

export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return data.subscription;
}
