import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen flex items-center justify-center neon-grid-bg relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,255,0.08)_0%,transparent_60%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-neon/20 flex items-center justify-center neon-glow-md mx-auto mb-4">
            <Shield className="w-6 h-6 text-neon" />
          </div>
          <h1 className="font-display text-lg font-bold tracking-widest text-neon neon-text-glow">KOLLECTION</h1>
        </div>

        <div className="bg-panel border border-neon/30 rounded-xl p-8 neon-glow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operator@kollection.io"
                className="w-full bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground font-body placeholder:text-muted-foreground/40 focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground font-body placeholder:text-muted-foreground/40 focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all"
              />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <NeonButton variant="solid" className="w-full" onClick={() => handleLogin('user')}>
              Authenticate
            </NeonButton>
          </div>

          {/* Demo role switcher */}
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-[10px] font-mono text-muted-foreground text-center mb-3 tracking-widest">DEMO ACCESS</p>
            <div className="grid grid-cols-2 gap-2">
              <NeonButton variant="outline" size="sm" onClick={() => handleLogin('user')}>
                👤 User Mode
              </NeonButton>
              <NeonButton variant="outline" size="sm" onClick={() => handleLogin('admin')}>
                🔐 Admin Mode
              </NeonButton>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          No account? <Link to="/" className="text-neon neon-text-glow hover:underline">Request access →</Link>
        </p>
      </motion.div>
    </div>
  );
}
