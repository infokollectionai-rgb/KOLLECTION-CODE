import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Check, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NeonButton from '@/components/ui/NeonButton';
import { verifyTwilio, verifyStripe, verifyVapi } from '@/services/provisioningService';

const TOTAL_STEPS = 5;
const businessTypes = ['Payday Loan Company', 'Personal Loan Provider', 'Auto Loan Company', 'Micro-lending / Cash Advance', 'Buy Now Pay Later (BNPL)', 'Peer-to-Peer Lending', 'Credit Union', 'Other'];
const loanTypes = ['Payday / Short-term loans', 'Personal installment loans', 'Auto title loans', 'Cash advances', 'Line of credit', 'Student loans', 'Business micro-loans', 'Other'];
const avgAmountOptions = ['$100–$300', '$300–$500', '$500–$1,000', '$1,000–$1,500', '$1,500+'];
const durationOptions = ['1–2 weeks', '1 month', '2–3 months', '3–6 months', '6–12 months', '12+ months'];
const monthlyAccountOptions = ['1–10', '10–50', '50–100', '100–500', '500+'];
const voiceOptions = ['Mature Female', 'Professional Male', 'Neutral', 'Custom'];

function Field({ label, required, error, children }: any) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground mb-1 block">{label} {required && <span className="text-destructive">*</span>}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }: any) {
  return <input {...props} className={`w-full bg-muted border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${error ? 'border-destructive' : 'border-border focus:border-primary/30'}`} />;
}

function Select({ options, error, ...props }: any) {
  return (
    <select {...props} className={`w-full bg-muted border rounded-md px-3 py-2 text-sm text-foreground outline-none ${error ? 'border-destructive' : 'border-border focus:border-primary/30'}`}>
      <option value="">Select...</option>
      {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [dir, setDir] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [license, setLicense] = useState('');

  // Step 2
  const [selectedLoanTypes, setSelectedLoanTypes] = useState<string[]>([]);
  const [avgAmount, setAvgAmount] = useState('$500–$1,000');
  const [loanDuration, setLoanDuration] = useState('');
  const [monthlyAccounts, setMonthlyAccounts] = useState('');
  const [monthlyPortfolio, setMonthlyPortfolio] = useState('');

  // Step 3 - Infrastructure
  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioPhone, setTwilioPhone] = useState('');
  const [twilioVerified, setTwilioVerified] = useState(false);
  const [twilioVerifying, setTwilioVerifying] = useState(false);

  const [stripePk, setStripePk] = useState('');
  const [stripeSk, setStripeSk] = useState('');
  const [stripeVerified, setStripeVerified] = useState(false);
  const [stripeVerifying, setStripeVerifying] = useState(false);

  const [vapiKey, setVapiKey] = useState('');
  const [agentName, setAgentName] = useState('Alex');
  const [agentVoice, setAgentVoice] = useState('Professional Male');
  const [vapiVerified, setVapiVerified] = useState(false);
  const [vapiVerifying, setVapiVerifying] = useState(false);

  const [showTwilioToken, setShowTwilioToken] = useState(false);
  const [showStripeSk, setShowStripeSk] = useState(false);

  const [payoutSameStripe, setPayoutSameStripe] = useState(true);

  // Step 4
  const [currency, setCurrency] = useState('');
  const [feeAgreed, setFeeAgreed] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!companyName.trim()) e.companyName = 'Required';
      if (!businessType) e.businessType = 'Required';
      if (!contactName.trim()) e.contactName = 'Required';
      if (!contactEmail.trim()) e.contactEmail = 'Required';
      else if (!emailRegex.test(contactEmail)) e.contactEmail = 'Invalid email';
      if (!contactPhone.trim()) e.contactPhone = 'Required';
    }
    if (s === 2) {
      if (selectedLoanTypes.length === 0) e.loanTypes = 'Select at least one';
      if (!loanDuration) e.loanDuration = 'Required';
      if (!monthlyAccounts) e.monthlyAccounts = 'Required';
    }
    if (s === 3) {
      if (!twilioVerified) e.twilio = 'Twilio must be verified';
      if (!stripeVerified) e.stripe = 'Stripe must be verified';
      if (!vapiVerified) e.vapi = 'VAPI must be verified';
    }
    if (s === 4) {
      if (!currency) e.currency = 'Required';
      if (!feeAgreed) e.feeAgreed = 'You must agree to the fee structure';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) { setDir(1); step === TOTAL_STEPS ? setSubmitted(true) : setStep(s => s + 1); } };
  const prev = () => { setDir(-1); setStep(s => Math.max(1, s - 1)); setErrors({}); };
  const goTo = (s: number) => { setDir(s > step ? 1 : -1); setStep(s); setErrors({}); };

  const handleVerifyTwilio = async () => {
    setTwilioVerifying(true);
    await verifyTwilio({ accountSid: twilioSid, authToken: twilioToken, phoneNumber: twilioPhone });
    setTwilioVerified(true);
    setTwilioVerifying(false);
  };

  const handleVerifyStripe = async () => {
    setStripeVerifying(true);
    await verifyStripe({ publishableKey: stripePk, secretKey: stripeSk });
    setStripeVerified(true);
    setStripeVerifying(false);
  };

  const handleVerifyVapi = async () => {
    setVapiVerifying(true);
    await verifyVapi({ apiKey: vapiKey, agentName, voice: agentVoice });
    setVapiVerified(true);
    setVapiVerifying(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card border border-border rounded-lg p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-3">Application Received</h1>
          <p className="text-sm text-muted-foreground mb-2">Your infrastructure is provisioned and ready.</p>
          <p className="text-sm text-muted-foreground mb-2">We'll activate your account within 1 business day.</p>
          <p className="text-sm text-muted-foreground mb-2">Login credentials will be sent to <span className="text-foreground">{contactEmail}</span>.</p>
          <div className="bg-muted border border-border rounded-md p-3 my-4 text-xs text-left space-y-1">
            <p className="text-muted-foreground">Your dedicated number: <span className="font-mono text-foreground">{twilioPhone || '+1 (XXX) XXX-XXXX'}</span></p>
            <p className="text-muted-foreground">Your AI agent: <span className="text-foreground">{agentName} from {companyName}</span></p>
          </div>
          <p className="text-xs text-muted-foreground mb-6">Questions? <span className="text-primary">partners@kollection.io</span></p>
          <Link to="/"><NeonButton>Back to Home</NeonButton></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-card border border-border rounded-lg overflow-hidden">
        <div className="h-1 bg-border"><div className="h-full bg-primary transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} /></div>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <img src={kollectionLogo} alt="Kollection" className="h-8 w-auto" />
            </div>
            <span className="text-xs text-muted-foreground font-mono">Step {step} of {TOTAL_STEPS}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.2 }}>
              {step === 1 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Company Information</h2><p className="text-sm text-muted-foreground">Basic details about your lending business.</p></div>
                  <Field label="Company Legal Name" required error={errors.companyName}><Input value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="e.g. QuickCash Loans Inc." error={errors.companyName} /></Field>
                  <Field label="Business License / RBQ Number"><Input value={license} onChange={(e: any) => setLicense(e.target.value)} placeholder="e.g. RBQ-2024-XXXXX" /></Field>
                  <Field label="Type of Business" required error={errors.businessType}><Select options={businessTypes} value={businessType} onChange={(e: any) => setBusinessType(e.target.value)} error={errors.businessType} /></Field>
                  <Field label="Website URL"><Input value={website} onChange={(e: any) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" /></Field>
                  <Field label="Business Address"><Input value={address} onChange={(e: any) => setAddress(e.target.value)} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City"><Input value={city} onChange={(e: any) => setCity(e.target.value)} /></Field>
                    <Field label="Province / State"><Input value={province} onChange={(e: any) => setProvince(e.target.value)} /></Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Country"><Select options={['Canada', 'USA']} value={country} onChange={(e: any) => setCountry(e.target.value)} /></Field>
                    <Field label="Timezone"><Select options={['EST', 'CST', 'MST', 'PST', 'AST', 'NST']} value={timezone} onChange={(e: any) => setTimezone(e.target.value)} /></Field>
                  </div>
                  <div className="border-t border-border pt-4"><p className="text-xs text-muted-foreground mb-3">Primary Contact</p></div>
                  <Field label="Full Name" required error={errors.contactName}><Input value={contactName} onChange={(e: any) => setContactName(e.target.value)} error={errors.contactName} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Email" required error={errors.contactEmail}><Input type="email" value={contactEmail} onChange={(e: any) => setContactEmail(e.target.value)} placeholder="you@company.com" error={errors.contactEmail} /></Field>
                    <Field label="Phone" required error={errors.contactPhone}><Input type="tel" value={contactPhone} onChange={(e: any) => setContactPhone(e.target.value)} placeholder="+1 (800) 555-0000" error={errors.contactPhone} /></Field>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Loan Portfolio</h2><p className="text-sm text-muted-foreground">Help us understand the debt we'll recover.</p></div>
                  <Field label="Types of Loans Issued" required error={errors.loanTypes}>
                    <div className="grid grid-cols-2 gap-2">
                      {loanTypes.map(lt => (
                        <label key={lt} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-xs transition-colors ${selectedLoanTypes.includes(lt) ? 'bg-primary/8 border-primary/20 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/20'}`}>
                          <input type="checkbox" checked={selectedLoanTypes.includes(lt)} onChange={() => setSelectedLoanTypes(p => p.includes(lt) ? p.filter(x => x !== lt) : [...p, lt])} className="sr-only" />
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${selectedLoanTypes.includes(lt) ? 'bg-primary border-primary' : 'border-border'}`}>
                            {selectedLoanTypes.includes(lt) && <Check className="w-2 h-2 text-white" />}
                          </div>
                          {lt}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-2 block">Average Loan Amount</label>
                    <div className="flex flex-wrap gap-2">{avgAmountOptions.map(o => (
                      <button key={o} type="button" onClick={() => setAvgAmount(o)} className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${avgAmount === o ? 'bg-primary/10 border-primary/25 text-primary' : 'border-border text-muted-foreground'}`}>{o}</button>
                    ))}</div>
                  </div>
                  <Field label="Typical Loan Duration" required error={errors.loanDuration}><Select options={durationOptions} value={loanDuration} onChange={(e: any) => setLoanDuration(e.target.value)} error={errors.loanDuration} /></Field>
                  <Field label="Avg Overdue Accounts / Month" required error={errors.monthlyAccounts}><Select options={monthlyAccountOptions} value={monthlyAccounts} onChange={(e: any) => setMonthlyAccounts(e.target.value)} error={errors.monthlyAccounts} /></Field>
                  <Field label="Est. Monthly Overdue Portfolio ($)"><Input type="number" value={monthlyPortfolio} onChange={(e: any) => setMonthlyPortfolio(e.target.value)} placeholder="45000" /></Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-base font-semibold">Set Up Your AI Recovery Infrastructure</h2>
                    <p className="text-sm text-muted-foreground">Each client gets dedicated phone, payments, and AI voice.</p>
                  </div>

                  {/* Info box */}
                  <div className="bg-primary/5 border border-primary/15 rounded-md p-3 text-xs text-muted-foreground leading-relaxed">
                    ℹ Your account includes a dedicated phone number for SMS and voice calls, your own Stripe payment processing, and a dedicated AI voice agent.
                  </div>

                  {errors.twilio && <p className="text-[10px] text-destructive">{errors.twilio}</p>}
                  {errors.stripe && <p className="text-[10px] text-destructive">{errors.stripe}</p>}
                  {errors.vapi && <p className="text-[10px] text-destructive">{errors.vapi}</p>}

                  {/* Twilio */}
                  <div className="bg-muted border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">Twilio — SMS + Phone Calls</p>
                      {twilioVerified && <span className="text-[10px] text-status-green font-mono">✓ Connected</span>}
                    </div>
                    <Field label="Account SID" required><Input value={twilioSid} onChange={(e: any) => setTwilioSid(e.target.value)} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" /></Field>
                    <Field label="Auth Token" required>
                      <div className="relative">
                        <Input type={showTwilioToken ? 'text' : 'password'} value={twilioToken} onChange={(e: any) => setTwilioToken(e.target.value)} />
                        <button type="button" onClick={() => setShowTwilioToken(!showTwilioToken)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showTwilioToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </Field>
                    <Field label="Phone Number" required><Input value={twilioPhone} onChange={(e: any) => setTwilioPhone(e.target.value)} placeholder="+18005550123" /></Field>
                    <NeonButton size="sm" variant="solid" loading={twilioVerifying} onClick={handleVerifyTwilio} disabled={twilioVerified}>
                      {twilioVerified ? '✓ Verified' : 'Verify Connection'}
                    </NeonButton>
                  </div>

                  {/* Stripe */}
                  <div className="bg-muted border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">Stripe — Payments</p>
                      {stripeVerified && <span className="text-[10px] text-status-green font-mono">✓ Connected</span>}
                    </div>
                    <Field label="Publishable Key" required><Input value={stripePk} onChange={(e: any) => setStripePk(e.target.value)} placeholder="pk_live_ or pk_test_" /></Field>
                    <Field label="Secret Key" required>
                      <div className="relative">
                        <Input type={showStripeSk ? 'text' : 'password'} value={stripeSk} onChange={(e: any) => setStripeSk(e.target.value)} placeholder="sk_live_ or sk_test_" />
                        <button type="button" onClick={() => setShowStripeSk(!showStripeSk)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                          {showStripeSk ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </Field>
                    <NeonButton size="sm" variant="solid" loading={stripeVerifying} onClick={handleVerifyStripe} disabled={stripeVerified}>
                      {stripeVerified ? '✓ Verified' : 'Verify & Connect Stripe'}
                    </NeonButton>
                  </div>

                  {/* VAPI */}
                  <div className="bg-muted border border-border rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-foreground">VAPI.AI — Voice Calls</p>
                      {vapiVerified && <span className="text-[10px] text-status-green font-mono">✓ Connected</span>}
                    </div>
                    <Field label="VAPI API Key" required><Input value={vapiKey} onChange={(e: any) => setVapiKey(e.target.value)} /></Field>
                    <Field label="AI Agent Name"><Input value={agentName} onChange={(e: any) => setAgentName(e.target.value)} placeholder="Alex" /></Field>
                    <Field label="Agent Voice"><Select options={voiceOptions} value={agentVoice} onChange={(e: any) => setAgentVoice(e.target.value)} /></Field>
                    <NeonButton size="sm" variant="solid" loading={vapiVerifying} onClick={handleVerifyVapi} disabled={vapiVerified}>
                      {vapiVerified ? '✓ Verified' : 'Verify VAPI Connection'}
                    </NeonButton>
                  </div>

                  {/* Payout account */}
                  <div className="bg-muted border border-border rounded-md p-4">
                    <p className="text-xs font-medium text-foreground mb-2">Stripe Payout Account</p>
                    <p className="text-[10px] text-muted-foreground mb-3">Your 50% is transferred here on the 1st of every month.</p>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-foreground">
                      <input type="radio" checked={payoutSameStripe} onChange={() => setPayoutSameStripe(true)} className="accent-[hsl(205,100%,50%)]" />
                      Same as my Stripe account above
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground mt-1.5">
                      <input type="radio" checked={!payoutSameStripe} onChange={() => setPayoutSameStripe(false)} className="accent-[hsl(205,100%,50%)]" />
                      Different Stripe account
                    </label>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold">Review Your Fee Structure</h2>
                    <p className="text-sm text-muted-foreground">Payout is monthly — 1st of every month, automatic via Stripe.</p>
                  </div>

                  <div className="bg-muted border border-border rounded-md p-4">
                    <p className="text-xs font-medium text-foreground mb-3">Kollection Fee Structure</p>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>One-time Setup Fee</span><span className="font-mono text-foreground">$5,000</span></div>
                      <div className="flex justify-between"><span>Recovery Fee</span><span className="text-foreground">50% of all amounts collected</span></div>
                      <div className="flex justify-between"><span>Operations Coverage</span><span className="text-foreground">8% of gross (covers SMS, calls, emails)</span></div>
                      <div className="flex justify-between"><span>Your Payout</span><span className="text-foreground">50% — sent 1st of each month</span></div>
                      <div className="flex justify-between"><span>Payment Method</span><span className="text-foreground">Automatic via Stripe</span></div>
                    </div>
                    <div className="border-t border-border mt-3 pt-3">
                      <p className="text-[10px] text-muted-foreground mb-1">EXAMPLE: If $1,000 is collected:</p>
                      <div className="space-y-0.5 text-[10px]">
                        <p className="text-muted-foreground">Operations deducted (8%): <span className="font-mono text-foreground">-$80</span></p>
                        <p className="text-muted-foreground">Remaining: <span className="font-mono text-foreground">$920</span></p>
                        <p className="text-muted-foreground">Kollection receives: <span className="font-mono text-foreground">$460</span></p>
                        <p className="text-muted-foreground">You receive: <span className="font-mono text-status-green">$460</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted border border-border rounded-md p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-primary border-2 border-primary" />
                      <p className="text-sm text-foreground font-medium">Monthly — 1st of every month</p>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5">Your payout arrives automatically. No action required.</p>
                  </div>

                  <Field label="Currency" required error={errors.currency}><Select options={['CAD', 'USD']} value={currency} onChange={(e: any) => setCurrency(e.target.value)} error={errors.currency} /></Field>

                  <label className={`flex items-center gap-2 cursor-pointer ${errors.feeAgreed ? 'text-destructive' : ''}`}>
                    <input type="checkbox" checked={feeAgreed} onChange={() => setFeeAgreed(!feeAgreed)} className="accent-[hsl(205,100%,50%)]" />
                    <span className="text-xs text-foreground">I agree to these terms and the automatic monthly payout structure</span>
                  </label>
                  {errors.feeAgreed && <p className="text-[10px] text-destructive">{errors.feeAgreed}</p>}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Review & Submit</h2><p className="text-sm text-muted-foreground">Confirm your details before submitting.</p></div>
                  {[
                    { title: 'Company', s: 1, items: [['Name', companyName], ['Type', businessType], ['Contact', contactName], ['Email', contactEmail], ['City', city], ['Country', country]] },
                    { title: 'Portfolio', s: 2, items: [['Loan Types', selectedLoanTypes.join(', ') || '—'], ['Avg Amount', avgAmount], ['Duration', loanDuration || '—'], ['Monthly Vol', monthlyAccounts || '—']] },
                    { title: 'Infrastructure', s: 3, items: [['Twilio', twilioVerified ? '✓ Connected' : '✗'], ['Stripe', stripeVerified ? '✓ Connected' : '✗'], ['VAPI', vapiVerified ? '✓ Connected' : '✗'], ['Agent', agentName]] },
                    { title: 'Fees & Payout', s: 4, items: [['Setup Fee', '$5,000'], ['Recovery', '50%'], ['Operations', '8%'], ['Schedule', 'Monthly — 1st'], ['Currency', currency || '—']] },
                  ].map(sec => (
                    <div key={sec.title} className="bg-muted border border-border rounded-md p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-foreground">{sec.title}</p>
                        <button onClick={() => goTo(sec.s)} className="text-[10px] text-primary hover:underline">Edit</button>
                      </div>
                      <div className="space-y-1">
                        {sec.items.map(([k, v]) => (
                          <div key={k as string} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{k}</span>
                            <span className={`text-foreground ${(v as string).includes('✓') ? 'text-status-green' : (v as string).includes('✗') ? 'text-destructive' : ''}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={prev} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="w-3 h-3" /> Back
              </button>
            ) : (
              <Link to="/signup" className="text-xs text-muted-foreground hover:text-foreground">← Back to Signup</Link>
            )}
            <NeonButton variant="solid" size="sm" onClick={next}>
              {step === TOTAL_STEPS ? 'Submit Application' : 'Continue'} <ChevronRight className="w-3 h-3" />
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
