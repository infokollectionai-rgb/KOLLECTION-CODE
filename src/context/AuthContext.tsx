import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = 'user' | 'admin';

interface AuthContextType {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  companyName: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('user');

  return (
    <AuthContext.Provider value={{ role, setRole, isAdmin: role === 'admin', companyName: 'MediCredit Corp' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
