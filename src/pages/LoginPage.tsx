import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import kollectionLogo from '@/assets/kollection-logo.png';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const { login, error: authError, isAdmin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <img src={kollectionLogo} alt="Kollection" className="h-14 w-auto mx-auto" />
          </Link>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none transition-colors"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive mt-3">{error}</p>
          )}

          <div className="mt-5">
            <NeonButton variant="solid" className="w-full" type="submit">
              Sign In
            </NeonButton>
          </div>
        </form>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          No account? <Link to="/signup" className="text-primary hover:underline">Apply here</Link>
        </p>
      </div>
    </div>
  );
}
