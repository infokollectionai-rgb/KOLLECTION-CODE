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
  enterDemoMode: (role?: 'admin' | 'client') => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOnboarded: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('client_companies' as string)
      .select('*')
      .eq('auth_user_id', userId)
      .single();
    if (error || !data) return null;
    return data as unknown as Profile;
  } catch {
    console.warn('Failed to fetch profile — table may not exist yet');
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const loadProfile = useCallback(async (u: User | null) => {
    if (!u) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(u.id);
    setProfile(p);
  }, []);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;
    let settled = false;

    const settle = () => {
      if (!settled) {
        settled = true;
        setLoading(false);
      }
    };

    // Safety timeout — never stay loading forever
    const timeout = setTimeout(() => {
      console.warn('Auth initialization timed out after 5s');
      settle();
    }, 5000);

    try {
      // Get initial session
      supabase.auth.getSession().then(async ({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        await loadProfile(s?.user ?? null);
        settle();
      }).catch((err) => {
        console.error('Failed to get session:', err);
        settle();
      });

      // Subscribe to auth changes
      subscription = onAuthStateChange(async (event, s) => {
        try {
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setSession(s);
            setUser(s?.user ?? null);
            await loadProfile(s?.user ?? null);
          } else if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
          }
        } catch (err) {
          console.error('Auth state change error:', err);
        }
      });
    } catch (err) {
      console.error('Auth initialization failed:', err);
      settle();
    }

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { error: err } = await signIn(email, password);
      if (err) setError(err.message);
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please try again.');
    }
  };

  const register = async (email: string, password: string, companyName: string, contactName: string) => {
    setError(null);
    try {
      const { error: err } = await signUp(email, password, {
        company_name: companyName,
        contact_name: contactName,
      });
      if (err) setError(err.message);
    } catch (e: any) {
      setError(e?.message || 'Registration failed. Please try again.');
    }
  };

  const logout = async () => {
    setError(null);
    setIsDemoMode(false);
    try {
      await authSignOut();
    } catch {
      // ignore
    }
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const enterDemoMode = (role: 'admin' | 'client' = 'client') => {
    setIsDemoMode(true);
    setProfile({
      id: 'demo',
      auth_user_id: 'demo',
      company_name: 'Demo Company',
      contact_name: 'Demo User',
      role,
      onboarding_complete: true,
    });
    setLoading(false);
  };

  const resetPasswordFn = async (email: string) => {
    setError(null);
    try {
      const { error: err } = await authResetPassword(email);
      if (err) setError(err.message);
    } catch (e: any) {
      setError(e?.message || 'Password reset failed.');
    }
  };

  const isAuthenticated = isDemoMode || session !== null;

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
        enterDemoMode,
        isAuthenticated,
        isAdmin: profile?.role === 'admin',
        isOnboarded: profile?.onboarding_complete === true,
        isDemoMode,
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
