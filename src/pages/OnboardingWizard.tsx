import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import NeonButton from '@/components/ui/NeonButton';

const TOTAL_STEPS = 4;
const businessTypes = ['Payday Loan Company', 'Personal Loan Provider', 'Auto Loan Company', 'Micro-lending / Cash Advance', 'Buy Now Pay Later (BNPL)', 'Peer-to-Peer Lending', 'Credit Union', 'Other'];
const loanTypes = ['Payday / Short-term loans', 'Personal installment loans', 'Auto title loans', 'Cash advances', 'Line of credit', 'Student loans', 'Business micro-loans', 'Other'];
const avgAmountOptions = ['$100–$300', '$300–$500', '$500–$1,000', '$1,000–$1,500', '$1,500+'];
const durationOptions = ['1–2 weeks', '1 month', '2–3 months', '3–6 months', '6–12 months', '12+ months'];
const monthlyAccountOptions = ['1–10', '10–50', '50–100', '100–500', '500+'];

function Field({ label, required, error, children }: any) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground mb-1 block">{label} {required && <span className="text-status-red">*</span>}</label>
      {children}
      {error && <p className="text-[10px] text-status-red mt-1">{error}</p>}
    </div>
  );
}

function Input({ error, ...props }: any) {
  return <input {...props} className={`w-full bg-raised border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors ${error ? 'border-status-red' : 'border-border focus:border-neon/30'}`} />;
}

function Select({ options, error, ...props }: any) {
  return (
    <select {...props} className={`w-full bg-raised border rounded-md px-3 py-2 text-sm text-foreground outline-none ${error ? 'border-status-red' : 'border-border focus:border-neon/30'}`}>
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

  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [country, setCountry] = useState('');
  const [license, setLicense] = useState('');

  const [selectedLoanTypes, setSelectedLoanTypes] = useState<string[]>([]);
  const [avgAmount, setAvgAmount] = useState('$500–$1,000');
  const [loanDuration, setLoanDuration] = useState('');
  const [monthlyAccounts, setMonthlyAccounts] = useState('');
  const [monthlyPortfolio, setMonthlyPortfolio] = useState('');

  const [payoutSchedule, setPayoutSchedule] = useState('Bi-weekly');
  const [currency, setCurrency] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
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
      if (!currency) e.currency = 'Required';
      if (!paymentMethod) e.paymentMethod = 'Required';
      if (!feeAgreed) e.feeAgreed = 'You must agree to the fee structure';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) { setDir(1); step === 4 ? setSubmitted(true) : setStep(s => s + 1); } };
  const prev = () => { setDir(-1); setStep(s => Math.max(1, s - 1)); setErrors({}); };
  const goTo = (s: number) => { setDir(s > step ? 1 : -1); setStep(s); setErrors({}); };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-panel border border-border rounded-lg p-10 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon/10 border border-neon/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-neon" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-3">Application Received</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your account is under review. We'll reach out within 1 business day to confirm your setup and collect the one-time activation fee.
          </p>
          <p className="text-xs text-muted-foreground mb-6">Questions? Email us at <span className="text-neon">partners@kollection.io</span></p>
          <Link to="/"><NeonButton>Back to Home</NeonButton></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-panel border border-border rounded-lg overflow-hidden">
        <div className="h-1 bg-border"><div className="h-full bg-neon transition-all" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} /></div>
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neon" />
              <span className="font-semibold text-sm text-foreground">Kollection</span>
            </div>
            <span className="text-xs text-muted-foreground font-mono">Step {step} of {TOTAL_STEPS}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: dir * 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -30 }} transition={{ duration: 0.2 }}>
              {step === 1 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Company Information</h2><p className="text-sm text-muted-foreground">Basic details about your lending business.</p></div>
                  <Field label="Company Name" required error={errors.companyName}><Input value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="e.g. QuickCash Loans" error={errors.companyName} /></Field>
                  <Field label="Business License / RBQ" ><Input value={license} onChange={(e: any) => setLicense(e.target.value)} placeholder="e.g. RBQ-2024-XXXXX" /></Field>
                  <Field label="Type of Business" required error={errors.businessType}><Select options={businessTypes} value={businessType} onChange={(e: any) => setBusinessType(e.target.value)} error={errors.businessType} /></Field>
                  <Field label="Website"><Input value={website} onChange={(e: any) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" /></Field>
                  <Field label="Address"><Input value={address} onChange={(e: any) => setAddress(e.target.value)} /></Field>
                  <Field label="Country"><Select options={['Canada', 'USA', 'Other']} value={country} onChange={(e: any) => setCountry(e.target.value)} /></Field>
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
                  <Field label="Types of Loans" required error={errors.loanTypes}>
                    <div className="grid grid-cols-2 gap-2">
                      {loanTypes.map(lt => (
                        <label key={lt} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-xs transition-colors ${selectedLoanTypes.includes(lt) ? 'bg-neon/8 border-neon/20 text-foreground' : 'border-border text-muted-foreground hover:border-muted-foreground/20'}`}>
                          <input type="checkbox" checked={selectedLoanTypes.includes(lt)} onChange={() => setSelectedLoanTypes(p => p.includes(lt) ? p.filter(x => x !== lt) : [...p, lt])} className="sr-only" />
                          <div className={`w-3 h-3 rounded border flex items-center justify-center ${selectedLoanTypes.includes(lt) ? 'bg-neon border-neon' : 'border-border'}`}>
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
                      <button key={o} type="button" onClick={() => setAvgAmount(o)} className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${avgAmount === o ? 'bg-neon/10 border-neon/25 text-neon' : 'border-border text-muted-foreground'}`}>{o}</button>
                    ))}</div>
                  </div>
                  <Field label="Typical Loan Duration" required error={errors.loanDuration}><Select options={durationOptions} value={loanDuration} onChange={(e: any) => setLoanDuration(e.target.value)} error={errors.loanDuration} /></Field>
                  <Field label="Avg Overdue Accounts / Month" required error={errors.monthlyAccounts}><Select options={monthlyAccountOptions} value={monthlyAccounts} onChange={(e: any) => setMonthlyAccounts(e.target.value)} error={errors.monthlyAccounts} /></Field>
                  <Field label="Est. Monthly Overdue Portfolio ($)"><Input type="number" value={monthlyPortfolio} onChange={(e: any) => setMonthlyPortfolio(e.target.value)} placeholder="45000" /></Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Payout Setup</h2><p className="text-sm text-muted-foreground">Configure how you receive recovered funds.</p></div>
                  <div>
                    <label className="text-[11px] text-muted-foreground mb-2 block">Payout Schedule</label>
                    <div className="flex gap-2">{['Weekly', 'Bi-weekly', 'Monthly'].map(o => (
                      <button key={o} type="button" onClick={() => setPayoutSchedule(o)} className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${payoutSchedule === o ? 'bg-neon/10 border-neon/25 text-neon' : 'border-border text-muted-foreground'}`}>{o}</button>
                    ))}</div>
                  </div>
                  <Field label="Currency" required error={errors.currency}><Select options={['CAD', 'USD']} value={currency} onChange={(e: any) => setCurrency(e.target.value)} error={errors.currency} /></Field>
                  <Field label="Payment Method" required error={errors.paymentMethod}>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ label: 'Stripe Connect', value: 'stripe' }, { label: 'Bank Transfer', value: 'bank' }].map(m => (
                        <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)} className={`p-3 rounded-md border text-sm text-center transition-colors ${paymentMethod === m.value ? 'bg-neon/8 border-neon/20 text-foreground' : 'border-border text-muted-foreground'}`}>{m.label}</button>
                      ))}
                    </div>
                  </Field>

                  <div className="bg-raised border border-border rounded-md p-4 mt-4">
                    <p className="text-xs font-medium text-foreground mb-3">Kollection Fee Agreement</p>
                    <div className="space-y-2 text-xs text-muted-foreground mb-4">
                      <p>One-time setup fee: <span className="text-foreground font-mono">$299</span> (charged on approval)</p>
                      <p>Recovery fee: <span className="text-foreground">50% of all amounts collected</span> on your behalf. You receive the other 50%.</p>
                      <p>No monthly charges. No hidden fees.</p>
                    </div>
                    <label className={`flex items-center gap-2 cursor-pointer ${errors.feeAgreed ? 'text-status-red' : ''}`}>
                      <input type="checkbox" checked={feeAgreed} onChange={() => setFeeAgreed(!feeAgreed)} className="accent-[hsl(205,100%,50%)]" />
                      <span className="text-xs text-foreground">I agree to these terms</span>
                    </label>
                    {errors.feeAgreed && <p className="text-[10px] text-status-red mt-1">{errors.feeAgreed}</p>}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div><h2 className="text-base font-semibold">Review & Submit</h2><p className="text-sm text-muted-foreground">Confirm your details before submitting.</p></div>
                  {[
                    { title: 'Company', s: 1, items: [['Name', companyName], ['Type', businessType], ['Contact', contactName], ['Email', contactEmail]] },
                    { title: 'Portfolio', s: 2, items: [['Loan Types', selectedLoanTypes.join(', ') || '—'], ['Avg Amount', avgAmount], ['Duration', loanDuration || '—'], ['Monthly Vol', monthlyAccounts || '—']] },
                    { title: 'Payout', s: 3, items: [['Schedule', payoutSchedule], ['Currency', currency || '—'], ['Method', paymentMethod || '—']] },
                  ].map(sec => (
                    <div key={sec.title} className="bg-raised border border-border rounded-md p-4">
                      <div className="flex justify-between mb-2">
                        <p className="text-xs text-muted-foreground">{sec.title}</p>
                        <button onClick={() => goTo(sec.s)} className="text-[10px] text-neon hover:underline">Edit</button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">{sec.items.map(([l, v]) => (
                        <div key={l as string}><p className="text-[10px] text-muted-foreground">{l}</p><p className="text-xs text-foreground truncate">{v as string}</p></div>
                      ))}</div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8 pt-5 border-t border-border">
            {step > 1 ? <NeonButton onClick={prev}><ChevronLeft className="w-3 h-3" /> Back</NeonButton> : <Link to="/"><NeonButton>Cancel</NeonButton></Link>}
            <NeonButton variant="solid" onClick={next}>{step === 4 ? <>Submit Application <ArrowRight className="w-3 h-3" /></> : <>Continue <ChevronRight className="w-3 h-3" /></>}</NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}
