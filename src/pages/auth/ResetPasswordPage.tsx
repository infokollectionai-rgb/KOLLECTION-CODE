import { useState } from 'react';
import { Link } from 'react-router-dom';
import kollectionLogo from '@/assets/kollection-logo.png';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { resetPassword, error: authError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!email) {
      setLocalError('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    await resetPassword(email);
    setSubmitting(false);
    if (!authError) setSent(true);
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-4">
            <img src={kollectionLogo} alt="Kollection" className="h-14 w-auto mx-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-foreground">Check your email for a reset link.</p>
              <Link to="/login" className="text-sm text-primary hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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

              {displayError && <p className="text-xs text-destructive">{displayError}</p>}

              <NeonButton variant="solid" className="w-full" type="submit" loading={submitting}>
                Send Reset Link
              </NeonButton>
            </form>
          )}
        </div>

        <p className="text-center mt-5 text-sm text-muted-foreground">
          <Link to="/login" className="text-primary hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
