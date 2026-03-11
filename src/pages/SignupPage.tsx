import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import kollectionLogo from '@/assets/kollection-logo.png';

export default function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!email.trim()) e.email = 'Email is required';
    else if (!emailRegex.test(email)) e.email = 'Enter a valid email address';
    if (!companyName.trim()) e.companyName = 'Company name is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      navigate('/onboarding');
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-raised border rounded-md px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${
      errors[field] ? 'border-status-red' : 'border-border focus:border-neon/30'
    }`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-lg bg-neon/10 flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-neon" />
            </div>
            <span className="font-semibold text-foreground">Kollection</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-2">Create your account</h1>
          <p className="text-sm text-muted-foreground">Sign up to start recovering your outstanding loans.</p>
        </div>

        {/* Form */}
        <div className="bg-panel border border-border rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Full Name <span className="text-status-red">*</span></label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="John Smith"
                className={inputClass('fullName')}
              />
              {errors.fullName && <p className="text-[10px] text-status-red mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Work Email <span className="text-status-red">*</span></label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass('email')}
              />
              {errors.email && <p className="text-[10px] text-status-red mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Company Name <span className="text-status-red">*</span></label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. QuickCash Loans Inc."
                className={inputClass('companyName')}
              />
              {errors.companyName && <p className="text-[10px] text-status-red mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Password <span className="text-status-red">*</span></label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className={inputClass('password')}
              />
              {errors.password && <p className="text-[10px] text-status-red mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">Confirm Password <span className="text-status-red">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className={inputClass('confirmPassword')}
              />
              {errors.confirmPassword && <p className="text-[10px] text-status-red mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>

          <div className="mt-6">
            <NeonButton variant="solid" className="w-full py-2.5" onClick={handleSubmit}>
              Create Account & Continue <ArrowRight className="w-3.5 h-3.5" />
            </NeonButton>
          </div>

          {/* Benefits */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="space-y-2.5">
              {[
                'No credit card required',
                'Complete onboarding in under 5 minutes',
                'Start recovering within 48 hours',
              ].map(text => (
                <div key={text} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-status-green flex-shrink-0" />
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="text-neon hover:underline">Sign in</Link>
          </p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            By creating an account you agree to our{' '}
            <a href="#" className="text-neon hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-neon hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
