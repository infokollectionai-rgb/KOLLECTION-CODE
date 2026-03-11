import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import kollectionLogo from '@/assets/kollection-logo.png';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';

export default function RegisterPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register, error: authError, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) navigate('/dashboard', { replace: true });
  }, [loading, isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!companyName || !contactName || !email || !password || !confirmPassword) {
      setLocalError('All fields are required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    await register(email, password, companyName, contactName);
    setSubmitting(false);
    // Navigate after successful registration (authError will be null)
    if (!authError) navigate('/onboarding', { replace: true });
  };

  const displayError = localError || authError;

  const inputClass =
    'w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <img src={kollectionLogo} alt="Kollection" className="h-14 w-auto mx-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Company Name</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." className={inputClass} />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Contact Name</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Jane Doe" className={inputClass} />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Business Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" className={inputClass} />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={`${inputClass} pr-9`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
          </div>

          {displayError && <p className="text-xs text-destructive">{displayError}</p>}

          <NeonButton variant="solid" className="w-full" type="submit" loading={submitting}>
            Create Account
          </NeonButton>
        </form>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
