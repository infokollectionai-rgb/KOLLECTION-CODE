import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Plus, Trash2, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import kollectionLogo from '@/assets/kollection-logo.png';
import { useAuth } from '@/context/AuthContext';
import NeonButton from '@/components/ui/NeonButton';
import { useToast } from '@/hooks/use-toast';
import {
  registerCompany,
  testTwilioConnection,
  testSendgridConnection,
  testVapiConnection,
  initiateStripeConnect,
} from '@/services/provisioningService';

/* ── constants ── */

const TOTAL_STEPS = 6;

const STEP_NAMES = [
  'Company Info',
  'Twilio',
  'SendGrid',
  'Stripe',
  'VAPI',
  'Preferences',
];

const PROVINCES = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
  'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
  'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon',
];

const INDUSTRIES = [
  'Debt Collection', 'Financial Services', 'Telecommunications',
  'Utilities', 'Healthcare', 'Other',
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const API = import.meta.env.VITE_API_URL ?? '';

/* ── tiny reusable parts ── */

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground mb-1 block">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Input({ error, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <input
      {...props}
      className={`w-full bg-muted border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${error ? 'border-destructive' : 'border-border focus:border-primary/30'} ${className ?? ''}`}
    />
  );
}

function PasswordInput({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} error={error} className="pr-9" />
      <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

function SelectInput({ options, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { options: string[]; error?: string }) {
  return (
    <select
      {...props}
      className={`w-full bg-muted border rounded-md px-3 py-2 text-sm text-foreground outline-none ${error ? 'border-destructive' : 'border-border focus:border-primary/30'}`}
    >
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

function TestButton({ status, errorMsg, onClick }: { status: TestStatus; errorMsg?: string; onClick: () => void }) {
  return (
    <div className="space-y-1">
      <NeonButton
        size="sm"
        variant={status === 'success' ? 'outline' : 'solid'}
        loading={status === 'testing'}
        onClick={onClick}
        disabled={status === 'testing' || status === 'success'}
      >
        {status === 'success' ? <><Check className="w-3 h-3 text-primary" /> Connected</> : 'Test Connection'}
      </NeonButton>
      {status === 'error' && errorMsg && <p className="text-[10px] text-destructive">{errorMsg}</p>}
    </div>
  );
}

/* ── wizard ── */

interface PhoneEntry { phone_number: string; label: string }

export default function OnboardingWizard() {
  const { user, session, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Step 1 — Company */
  const [companyName, setCompanyName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [industry, setIndustry] = useState('');

  /* Step 2 — Twilio */
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneEntry[]>([{ phone_number: '', label: 'Primary' }]);
  const [twilioStatus, setTwilioStatus] = useState<TestStatus>('idle');
  const [twilioError, setTwilioError] = useState('');

  /* Step 3 — SendGrid */
  const [sendgridKey, setSendgridKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('KOLLECTION Recovery');
  const [replyToEmail, setReplyToEmail] = useState('');
  const [sgStatus, setSgStatus] = useState<TestStatus>('idle');
  const [sgError, setSgError] = useState('');

  /* Step 4 — Stripe */
  const [stripeSecret, setStripeSecret] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('CAD');
  const [stripeConnectId, setStripeConnectId] = useState('');
  const [stripeConnecting, setStripeConnecting] = useState(false);

  /* Step 5 — VAPI */
  const [vapiKey, setVapiKey] = useState('');
  const [vapiAssistantId, setVapiAssistantId] = useState('');
  const [voiceAgentName, setVoiceAgentName] = useState('Alex');
  const [vapiStatus, setVapiStatus] = useState<TestStatus>('idle');
  const [vapiError, setVapiError] = useState('');

  /* Step 6 — Preferences */
  const [floorPct, setFloorPct] = useState(30);
  const [linkExpiry, setLinkExpiry] = useState(48);
  const [maxContacts, setMaxContacts] = useState(7);
  const [contactStart, setContactStart] = useState('08:00');
  const [contactEnd, setContactEnd] = useState('20:00');
  const [blockedDays, setBlockedDays] = useState<string[]>(['Sunday']);
  const [autoEscalate, setAutoEscalate] = useState(3);

  const [submitting, setSubmitting] = useState(false);

  // Prefill from auth
  useEffect(() => {
    if (user) {
      setCompanyName(user.user_metadata?.company_name ?? '');
      setBusinessEmail(user.email ?? '');
    }
  }, [user]);

  /* ── validation ── */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+1\d{10}$/;

  const validate = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!companyName.trim()) e.companyName = 'Required';
      if (!street.trim()) e.street = 'Required';
      if (!city.trim()) e.city = 'Required';
      if (!province) e.province = 'Required';
      if (!postalCode.trim()) e.postalCode = 'Required';
      if (!businessPhone.trim()) e.businessPhone = 'Required';
      else if (!phoneRegex.test(businessPhone)) e.businessPhone = 'Format: +1XXXXXXXXXX';
      if (!businessEmail.trim()) e.businessEmail = 'Required';
      else if (!emailRegex.test(businessEmail)) e.businessEmail = 'Invalid email';
      if (!industry) e.industry = 'Required';
    }
    if (s === 2) {
      if (!twilioSid.trim()) e.twilioSid = 'Required';
      if (!twilioToken.trim()) e.twilioToken = 'Required';
      const validPhones = phoneNumbers.filter(p => p.phone_number.trim());
      if (validPhones.length === 0) e.phoneNumbers = 'At least 1 phone number required';
      phoneNumbers.forEach((p, i) => {
        if (p.phone_number.trim() && !phoneRegex.test(p.phone_number)) e[`phone_${i}`] = 'Format: +1XXXXXXXXXX';
      });
    }
    if (s === 3) {
      if (!sendgridKey.trim()) e.sendgridKey = 'Required';
      if (!fromEmail.trim()) e.fromEmail = 'Required';
      else if (!emailRegex.test(fromEmail)) e.fromEmail = 'Invalid email';
      if (!fromName.trim()) e.fromName = 'Required';
    }
    if (s === 4) {
      if (!stripeSecret.trim()) e.stripeSecret = 'Required';
      if (!stripeWebhookSecret.trim()) e.stripeWebhookSecret = 'Required';
    }
    if (s === 5) {
      if (!vapiKey.trim()) e.vapiKey = 'Required';
      if (!vapiAssistantId.trim()) e.vapiAssistantId = 'Required';
    }
    if (s === 6) {
      if (floorPct < 1 || floorPct > 100) e.floorPct = '1–100';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setDir(1);
    setStep(s => Math.min(TOTAL_STEPS, s + 1));
  };

  const prev = () => {
    setDir(-1);
    setStep(s => Math.max(1, s - 1));
    setErrors({});
  };

  /* ── test helpers ── */
  async function testEndpoint(url: string, body: object): Promise<{ ok: boolean; msg?: string }> {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) return { ok: true };
      const data = await res.json().catch(() => ({}));
      return { ok: false, msg: data.error ?? data.message ?? `Error ${res.status}` };
    } catch (err: any) {
      return { ok: false, msg: err.message ?? 'Network error' };
    }
  }

  const handleTestTwilio = async () => {
    setTwilioStatus('testing');
    const r = await testEndpoint(`${API}/provision/test-twilio`, { account_sid: twilioSid, auth_token: twilioToken });
    setTwilioStatus(r.ok ? 'success' : 'error');
    setTwilioError(r.msg ?? '');
  };

  const handleTestSendGrid = async () => {
    setSgStatus('testing');
    const r = await testEndpoint(`${API}/provision/test-sendgrid`, { api_key: sendgridKey });
    setSgStatus(r.ok ? 'success' : 'error');
    setSgError(r.ok ? '' : (r.msg ?? 'Failed. Check API key and domain authentication.'));
  };

  const handleTestVapi = async () => {
    setVapiStatus('testing');
    const r = await testEndpoint(`${API}/provision/test-vapi`, { api_key: vapiKey });
    setVapiStatus(r.ok ? 'success' : 'error');
    setVapiError(r.msg ?? '');
  };

  const handleStripeConnect = async () => {
    setStripeConnecting(true);
    try {
      const res = await fetch(`${API}/stripe/connect/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ stripe_secret_key: stripeSecret }),
      });
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
      if (data.account_id) setStripeConnectId(data.account_id);
    } catch {
      // ignore
    } finally {
      setStripeConnecting(false);
    }
  };

  /* ── phone numbers list ── */
  const addPhone = () => {
    if (phoneNumbers.length >= 5) return;
    setPhoneNumbers([...phoneNumbers, { phone_number: '', label: `Rotation ${phoneNumbers.length}` }]);
  };

  const removePhone = (i: number) => {
    if (phoneNumbers.length <= 1) return;
    setPhoneNumbers(phoneNumbers.filter((_, idx) => idx !== i));
  };

  const updatePhone = (i: number, field: keyof PhoneEntry, v: string) => {
    const copy = [...phoneNumbers];
    copy[i] = { ...copy[i], [field]: v };
    setPhoneNumbers(copy);
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!validate(6)) return;
    setSubmitting(true);

    const payload = {
      company: {
        company_name: companyName,
        business_address: { street, city, province, postal_code: postalCode },
        business_phone: businessPhone,
        business_email: businessEmail,
        company_logo_url: companyLogoUrl || undefined,
        industry,
      },
      twilio: {
        account_sid: twilioSid,
        auth_token: twilioToken,
        phone_numbers: phoneNumbers.filter(p => p.phone_number.trim()),
      },
      sendgrid: {
        api_key: sendgridKey,
        from_email: fromEmail,
        from_name: fromName,
        reply_to_email: replyToEmail || fromEmail,
      },
      stripe: {
        secret_key: stripeSecret,
        webhook_secret: stripeWebhookSecret,
        default_currency: defaultCurrency,
        connect_account_id: stripeConnectId || undefined,
      },
      vapi: {
        api_key: vapiKey,
        assistant_id: vapiAssistantId,
        voice_agent_name: voiceAgentName,
      },
      preferences: {
        default_floor_percentage: floorPct,
        default_link_expiry_hours: linkExpiry,
        max_contacts_per_7_days: maxContacts,
        platform_fee_percentage: 50,
        contact_hours_start: contactStart,
        contact_hours_end: contactEnd,
        blocked_days: blockedDays,
        auto_escalate_after_broken_promises: autoEscalate,
      },
    };

    try {
      const res = await fetch(`${API}/companies/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? data.message ?? 'Registration failed');
      }

      toast({ title: 'Success', description: 'Your account is set up! Redirecting to dashboard...' });

      // Mark onboarding complete
      const supabaseModule = await import('@/lib/supabase');
      if (user) {
        await (supabaseModule.default as any).from('client_companies').update({ onboarding_complete: true }).eq('auth_user_id', user.id);
      }

      setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ── toggle blocked day ── */
  const toggleDay = (day: string) => {
    setBlockedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg overflow-hidden">
        {/* progress bar */}
        <div className="h-1 bg-border">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>

        <div className="p-6 sm:p-8">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <img src={kollectionLogo} alt="Kollection" className="h-8 w-auto" />
            <div className="text-right">
              <span className="text-xs text-muted-foreground font-mono">Step {step} of {TOTAL_STEPS}</span>
              <p className="text-[10px] text-muted-foreground">{STEP_NAMES[step - 1]}</p>
            </div>
          </div>

          {/* step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: dir * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -30 }}
              transition={{ duration: 0.2 }}
            >
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Company Information</h2>
                    <p className="text-sm text-muted-foreground">Basic details about your business.</p>
                  </div>
                  <Field label="Company Name" required error={errors.companyName}>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." error={errors.companyName} />
                  </Field>
                  <Field label="Street Address" required error={errors.street}>
                    <Input value={street} onChange={e => setStreet(e.target.value)} placeholder="123 Main St" error={errors.street} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City" required error={errors.city}>
                      <Input value={city} onChange={e => setCity(e.target.value)} error={errors.city} />
                    </Field>
                    <Field label="Province" required error={errors.province}>
                      <SelectInput options={PROVINCES} value={province} onChange={e => setProvince(e.target.value)} error={errors.province} />
                    </Field>
                  </div>
                  <Field label="Postal Code" required error={errors.postalCode}>
                    <Input value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="A1A 1A1" error={errors.postalCode} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Business Phone" required error={errors.businessPhone}>
                      <Input value={businessPhone} onChange={e => setBusinessPhone(e.target.value)} placeholder="+14165551234" error={errors.businessPhone} />
                    </Field>
                    <Field label="Business Email" required error={errors.businessEmail}>
                      <Input type="email" value={businessEmail} onChange={e => setBusinessEmail(e.target.value)} error={errors.businessEmail} />
                    </Field>
                  </div>
                  <Field label="Company Logo URL">
                    <Input value={companyLogoUrl} onChange={e => setCompanyLogoUrl(e.target.value)} placeholder="https://..." />
                  </Field>
                  <Field label="Industry" required error={errors.industry}>
                    <SelectInput options={INDUSTRIES} value={industry} onChange={e => setIndustry(e.target.value)} error={errors.industry} />
                  </Field>
                </div>
              )}

              {/* STEP 2 — Twilio */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Twilio Configuration</h2>
                    <p className="text-sm text-muted-foreground">Connect your Twilio account for SMS and voice calls</p>
                  </div>
                  <Field label="Account SID" required error={errors.twilioSid}>
                    <Input value={twilioSid} onChange={e => setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" error={errors.twilioSid} />
                  </Field>
                  <Field label="Auth Token" required error={errors.twilioToken}>
                    <PasswordInput value={twilioToken} onChange={setTwilioToken} error={errors.twilioToken} />
                  </Field>

                  <div className="space-y-2">
                    <label className="text-[11px] text-muted-foreground block">
                      Phone Numbers <span className="text-destructive">*</span>
                    </label>
                    {errors.phoneNumbers && <p className="text-[10px] text-destructive">{errors.phoneNumbers}</p>}
                    {phoneNumbers.map((p, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={p.phone_number}
                            onChange={e => updatePhone(i, 'phone_number', e.target.value)}
                            placeholder="+14165551234"
                            error={errors[`phone_${i}`]}
                          />
                          {errors[`phone_${i}`] && <p className="text-[10px] text-destructive mt-0.5">{errors[`phone_${i}`]}</p>}
                        </div>
                        <Input
                          value={p.label}
                          onChange={e => updatePhone(i, 'label', e.target.value)}
                          placeholder="Label"
                          className="!w-32"
                        />
                        {phoneNumbers.length > 1 && (
                          <button type="button" onClick={() => removePhone(i)} className="mt-2 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {phoneNumbers.length < 5 && (
                      <button type="button" onClick={addPhone} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        <Plus className="w-3 h-3" /> Add another number
                      </button>
                    )}
                  </div>

                  <TestButton status={twilioStatus} errorMsg={twilioError} onClick={handleTestTwilio} />
                </div>
              )}

              {/* STEP 3 — SendGrid */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">SendGrid Configuration</h2>
                    <p className="text-sm text-muted-foreground">Connect SendGrid for automated email outreach</p>
                  </div>
                  <Field label="API Key" required error={errors.sendgridKey}>
                    <PasswordInput value={sendgridKey} onChange={setSendgridKey} placeholder="SG.xxxxxxxxxxxx" error={errors.sendgridKey} />
                  </Field>
                  <Field label="From Email" required error={errors.fromEmail}>
                    <Input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="noreply@yourdomain.com" error={errors.fromEmail} />
                  </Field>
                  <Field label="From Name" required error={errors.fromName}>
                    <Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="KOLLECTION Recovery" error={errors.fromName} />
                  </Field>
                  <Field label="Reply-to Email (optional)">
                    <Input type="email" value={replyToEmail} onChange={e => setReplyToEmail(e.target.value)} placeholder="Defaults to From Email" />
                  </Field>
                  <TestButton status={sgStatus} errorMsg={sgError} onClick={handleTestSendGrid} />
                </div>
              )}

              {/* STEP 4 — Stripe */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Stripe Configuration</h2>
                    <p className="text-sm text-muted-foreground">Connect Stripe for instant payment links</p>
                  </div>
                  <Field label="Secret Key" required error={errors.stripeSecret}>
                    <PasswordInput value={stripeSecret} onChange={setStripeSecret} placeholder="sk_test_xxxx" error={errors.stripeSecret} />
                  </Field>
                  <Field label="Webhook Secret" required error={errors.stripeWebhookSecret}>
                    <PasswordInput value={stripeWebhookSecret} onChange={setStripeWebhookSecret} placeholder="whsec_xxxx" error={errors.stripeWebhookSecret} />
                  </Field>
                  <Field label="Default Currency">
                    <SelectInput options={['CAD', 'USD']} value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} />
                  </Field>
                  <div className="space-y-2">
                    <NeonButton size="sm" variant="solid" onClick={handleStripeConnect} loading={stripeConnecting}>
                      Connect Stripe Account
                    </NeonButton>
                    {stripeConnectId && (
                      <Field label="Stripe Connect Account ID">
                        <Input value={stripeConnectId} readOnly className="opacity-70" />
                      </Field>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 5 — VAPI */}
              {step === 5 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">VAPI Configuration</h2>
                    <p className="text-sm text-muted-foreground">Connect VAPI.ai for AI voice calls</p>
                  </div>
                  <Field label="API Key" required error={errors.vapiKey}>
                    <PasswordInput value={vapiKey} onChange={setVapiKey} error={errors.vapiKey} />
                  </Field>
                  <Field label="Assistant ID" required error={errors.vapiAssistantId}>
                    <Input value={vapiAssistantId} onChange={e => setVapiAssistantId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" error={errors.vapiAssistantId} />
                  </Field>
                  <Field label="Voice Agent Name">
                    <Input value={voiceAgentName} onChange={e => setVoiceAgentName(e.target.value)} placeholder="Alex" />
                  </Field>
                  <TestButton status={vapiStatus} errorMsg={vapiError} onClick={handleTestVapi} />
                </div>
              )}

              {/* STEP 6 — Preferences */}
              {step === 6 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Collection Preferences</h2>
                    <p className="text-sm text-muted-foreground">Set your default collection rules</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Min. % of balance to accept" required error={errors.floorPct}>
                      <Input type="number" min={1} max={100} value={floorPct} onChange={e => setFloorPct(Number(e.target.value))} error={errors.floorPct} />
                    </Field>
                    <Field label="Payment link expiry (hours)">
                      <Input type="number" min={1} value={linkExpiry} onChange={e => setLinkExpiry(Number(e.target.value))} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Max contacts per 7 days">
                      <Input type="number" min={1} value={maxContacts} onChange={e => setMaxContacts(Number(e.target.value))} />
                    </Field>
                    <Field label="Platform fee %">
                      <Input type="number" value={50} readOnly className="opacity-70" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Contact hours start">
                      <Input type="time" value={contactStart} onChange={e => setContactStart(e.target.value)} />
                    </Field>
                    <Field label="Contact hours end">
                      <Input type="time" value={contactEnd} onChange={e => setContactEnd(e.target.value)} />
                    </Field>
                  </div>
                  <Field label="Auto-escalate after broken promises">
                    <Input type="number" min={1} value={autoEscalate} onChange={e => setAutoEscalate(Number(e.target.value))} />
                  </Field>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-2 block">Blocked Days</label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map(day => (
                        <label
                          key={day}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer text-xs transition-colors ${
                            blockedDays.includes(day)
                              ? 'bg-primary/10 border-primary/25 text-foreground'
                              : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                          }`}
                        >
                          <input type="checkbox" checked={blockedDays.includes(day)} onChange={() => toggleDay(day)} className="sr-only" />
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${
                            blockedDays.includes(day) ? 'bg-primary border-primary' : 'border-border'
                          }`}>
                            {blockedDays.includes(day) && <Check className="w-2 h-2 text-primary-foreground" />}
                          </div>
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* navigation */}
          <div className="flex justify-between mt-8 pt-4 border-t border-border">
            {step > 1 ? (
              <NeonButton variant="ghost" onClick={prev}>
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </NeonButton>
            ) : <div />}

            {step < TOTAL_STEPS ? (
              <NeonButton variant="solid" onClick={next}>
                Next <ChevronRight className="w-3.5 h-3.5" />
              </NeonButton>
            ) : (
              <NeonButton variant="solid" onClick={handleSubmit} loading={submitting}>
                {submitting ? 'Submitting…' : 'Submit Application'}
              </NeonButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
