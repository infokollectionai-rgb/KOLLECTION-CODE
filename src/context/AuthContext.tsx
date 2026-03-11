import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';
import { signIn, signOut as authSignOut, signUp, onAuthStateChange, resetPassword as authResetPassword } from '@/services/authService';

interface Profile {
  id: string;
  auth_user_id: string;
  company_name: string;
  contact_name: string;
  role: string;
  onboarding_complete: boolean;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, companyName: string, contactName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnboarded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('client_companies' as string)
    .select('*')
    .eq('auth_user_id', userId)
    .single();
  if (error || !data) return null;
  return data as unknown as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(u.id);
    setProfile(p);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      await loadProfile(s?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const subscription = onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(s);
        setUser(s?.user ?? null);
        await loadProfile(s?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
  };

  const register = async (email: string, password: string, companyName: string, contactName: string) => {
    setError(null);
    const { error: err } = await signUp(email, password, {
      company_name: companyName,
      contact_name: contactName,
    });
    if (err) setError(err.message);
  };

  const logout = async () => {
    setError(null);
    await authSignOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const resetPasswordFn = async (email: string) => {
    setError(null);
    const { error: err } = await authResetPassword(email);
    if (err) setError(err.message);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        error,
        login,
        register,
        logout,
        resetPassword: resetPasswordFn,
        isAuthenticated: session !== null,
        isAdmin: profile?.role === 'admin',
        isOnboarded: profile?.onboarding_complete === true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
