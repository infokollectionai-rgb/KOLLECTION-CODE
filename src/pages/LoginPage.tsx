import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setRole } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: 'user' | 'admin') => {
    setRole(role);
    navigate(role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-neon/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-5 h-5 text-neon" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Kollection</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <div className="bg-panel border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-raised border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-raised border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon/30 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="mt-5">
            <NeonButton variant="solid" className="w-full" onClick={() => handleLogin('user')}>
              Sign In
            </NeonButton>
          </div>

          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[11px] text-muted-foreground text-center mb-3">Demo access</p>
            <div className="grid grid-cols-2 gap-2">
              <NeonButton size="sm" onClick={() => handleLogin('user')}>Client View</NeonButton>
              <NeonButton size="sm" onClick={() => handleLogin('admin')}>Admin View</NeonButton>
            </div>
          </div>
        </div>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          No account? <Link to="/signup" className="text-neon hover:underline">Sign up here</Link>
        </p>
      </div>
    </div>
  );
}
