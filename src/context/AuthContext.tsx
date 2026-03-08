import { createContext, useContext, useState, ReactNode } from 'react';
import { DEMO_USERS } from '@/data/demoUsers';

type Role = 'user' | 'admin';

interface User {
  email: string;
  role: Role;
  name: string;
  company: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; role?: Role; error?: string };
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    const match = DEMO_USERS.find(
      u => u.email === email && u.password === password
    );
    if (match) {
      setUser({ email: match.email, role: match.role, name: match.name, company: match.company });
      return { success: true, role: match.role };
    }
    return { success: false, error: 'Invalid email or password' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
