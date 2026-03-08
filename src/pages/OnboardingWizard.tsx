import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';

const TOTAL_STEPS = 6;

const businessTypes = [
  'Payday Loan Company', 'Personal Loan Provider', 'Auto Loan Company',
  'Micro-lending / Cash Advance', 'Buy Now Pay Later (BNPL)',
  'Peer-to-Peer Lending', 'Credit Union', 'Other',
];

const loanTypes = [
  'Payday / Short-term loans', 'Personal installment loans', 'Auto title loans',
  'Cash advances', 'Line of credit', 'Student loans', 'Business micro-loans', 'Other',
];

const avgAmountOptions = ['$100–$300', '$300–$500', '$500–$1,000', '$1,000–$1,500', '$1,500–$3,000', '$3,000+'];
const durationOptions = ['1–2 weeks', '1 month', '2–3 months', '3–6 months', '6–12 months', '12+ months'];
const monthlyAccountOptions = ['1–10', '10–50', '50–100', '100–500', '500+'];
const escalationOptions = [
  '3 broken promises',
  '5 unanswered contacts',
  '10 days of no response',
  '3 broken promises OR 10 days no response (recommended)',
];
const toneOptions = [
  { emoji: '🤝', label: 'EMPATHETIC', desc: 'Friendly, understanding, focuses on helping the debtor find a solution' },
  { emoji: '💼', label: 'PROFESSIONAL', desc: 'Neutral, factual, business-focused tone' },
  { emoji: '⚡', label: 'FIRM', desc: 'Direct and urgent, used for high-overdue accounts' },
];
const timezones = [
  'America/New_York (EST)', 'America/Chicago (CST)', 'America/Denver (MST)',
  'America/Los_Angeles (PST)', 'America/Toronto (EST)', 'America/Vancouver (PST)',
  'America/Montreal (EST)', 'Europe/London (GMT)', 'Other',
];

function NeonInput({ label, required, error, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1.5">
        {label} {required && <span className="text-status-red">*</span>}
      </label>
      <input
        {...props}
        className={`w-full bg-deep border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none transition-all ${
          error ? 'border-status-red focus:border-status-red focus:shadow-[0_0_8px_rgba(255,51,102,0.4)]' : 'border-border focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)]'
        }`}
      />
      {error && <p className="text-[10px] font-mono text-status-red mt-1 tracking-wider">{error}</p>}
    </div>
  );
}

function NeonSelect({ label, required, error, options, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1.5">
        {label} {required && <span className="text-status-red">*</span>}
      </label>
      <select
        {...props}
        className={`w-full bg-deep border rounded-md px-3 py-2.5 text-sm text-foreground outline-none transition-all appearance-none ${
          error ? 'border-status-red' : 'border-border focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)]'
        }`}
      >
        <option value="">Select...</option>
        {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-[10px] font-mono text-status-red mt-1 tracking-wider">{error}</p>}
    </div>
  );
}

function NeonTextarea({ label, required, error, ...props }: any) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-1.5">
        {label} {required && <span className="text-status-red">*</span>}
      </label>
      <textarea
        {...props}
        className={`w-full bg-deep border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none h-20 outline-none transition-all ${
          error ? 'border-status-red' : 'border-border focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)]'
        }`}
      />
      {error && <p className="text-[10px] font-mono text-status-red mt-1 tracking-wider">{error}</p>}
    </div>
  );
}

function SegmentedSelector({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all border ${
              value === opt ? 'bg-neon/20 text-neon border-neon/40 shadow-[0_0_8px_rgba(0,200,255,0.6)]' : 'border-border text-muted-foreground hover:border-neon/20 hover:text-foreground'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [businessLicense, setBusinessLicense] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [cityProvince, setCityProvince] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2
  const [selectedLoanTypes, setSelectedLoanTypes] = useState<string[]>([]);
  const [avgAmount, setAvgAmount] = useState('$500–$1,000');
  const [minLoan, setMinLoan] = useState('');
  const [maxLoan, setMaxLoan] = useState('');
  const [loanDuration, setLoanDuration] = useState('');
  const [interestRate, setInterestRate] = useState(25);
  const [lateFeePolicy, setLateFeePolicy] = useState('');
  const [gracePeriod, setGracePeriod] = useState('');
  const [gracePeriodUnit, setGracePeriodUnit] = useState('days');
  const [monthlyAccounts, setMonthlyAccounts] = useState('');
  const [monthlyPortfolio, setMonthlyPortfolio] = useState('');

  // Step 3
  const [softTarget, setSoftTarget] = useState(80);
  const [hardFloor, setHardFloor] = useState(40);
  const [allowSettlement, setAllowSettlement] = useState(true);
  const [allowMicro, setAllowMicro] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState(8);
  const [escalationRule, setEscalationRule] = useState(escalationOptions[3]);
  const [aiTone, setAiTone] = useState('PROFESSIONAL');

  // Step 4
  const [smsProvider, setSmsProvider] = useState('');
  const [smsNumber, setSmsNumber] = useState('');
  const [emailProvider, setEmailProvider] = useState('');
  const [replyEmail, setReplyEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [contactFrom, setContactFrom] = useState('08:00');
  const [contactTo, setContactTo] = useState('20:00');
  const [blackoutSat, setBlackoutSat] = useState(false);
  const [blackoutSun, setBlackoutSun] = useState(true);
  const [blackoutHolidays, setBlackoutHolidays] = useState(false);
  const [language, setLanguage] = useState('');

  // Step 5
  const [paymentProcessor, setPaymentProcessor] = useState('');
  const [stripePublic, setStripePublic] = useState('');
  const [stripeSecret, setStripeSecret] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('');
  const [payoutSchedule, setPayoutSchedule] = useState('Bi-weekly');
  const [feeAgreed, setFeeAgreed] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!companyName.trim()) e.companyName = 'Required';
      if (!businessType) e.businessType = 'Required';
      if (!contactName.trim()) e.contactName = 'Required';
      if (!contactEmail.trim()) e.contactEmail = 'Required';
      else if (!emailRegex.test(contactEmail)) e.contactEmail = 'Invalid email';
      if (!contactPhone.trim()) e.contactPhone = 'Required';
      if (!country) e.country = 'Required';
      if (website && !website.startsWith('https://') && !website.startsWith('http://')) e.website = 'Must start with https://';
    }
    if (s === 2) {
      if (selectedLoanTypes.length === 0) e.loanTypes = 'Select at least one';
      if (!loanDuration) e.loanDuration = 'Required';
      if (!monthlyAccounts) e.monthlyAccounts = 'Required';
    }
    if (s === 4) {
      if (!smsProvider) e.smsProvider = 'Required';
      if (!emailProvider) e.emailProvider = 'Required';
      if (!displayName.trim()) e.displayName = 'Required';
      if (!language) e.language = 'Required';
      if (replyEmail && !emailRegex.test(replyEmail)) e.replyEmail = 'Invalid email';
    }
    if (s === 5) {
      if (!paymentProcessor) e.paymentProcessor = 'Required';
      if (!currency) e.currency = 'Required';
      if (!feeAgreed) e.feeAgreed = 'You must agree to the fee structure';
      if (paymentProcessor === 'Stripe') {
        if (!stripePublic.trim()) e.stripePublic = 'Required';
      }
      if (paymentProcessor === 'Bank Transfer (ACH/EFT)') {
        if (!bankName.trim()) e.bankName = 'Required';
        if (!routingNumber.trim()) e.routingNumber = 'Required';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setDirection(1);
      if (step === 6) {
        setSubmitted(true);
      } else {
        setStep(s => s + 1);
      }
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep(s => Math.max(1, s - 1));
    setErrors({});
  };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
    setErrors({});
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background neon-grid-bg flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[680px] bg-panel border border-neon/15 rounded-2xl p-12 text-center"
        >
          {/* Animated checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-8 rounded-full bg-neon/10 border-2 border-neon flex items-center justify-center shadow-[0_0_30px_rgba(0,200,255,0.4)]"
          >
            <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}>
              <Check className="w-12 h-12 text-neon" />
            </motion.div>
          </motion.div>

          <h1 className="font-display text-2xl font-bold tracking-widest text-foreground mb-4">
            YOUR ACCOUNT IS BEING ACTIVATED
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Our team will review your application within 1 business day. You'll receive a confirmation email at{' '}
            <span className="text-neon font-mono">{contactEmail}</span> with your login credentials and next steps.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/"><NeonButton variant="outline">Back to Home</NeonButton></Link>
            <NeonButton variant="solid">Book an Onboarding Call</NeonButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background neon-grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[680px] bg-panel border border-neon/15 rounded-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="relative h-1 bg-border">
          <motion.div
            className="h-full bg-neon shadow-[0_0_10px_rgba(0,200,255,0.8)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-neon/20 flex items-center justify-center shadow-[0_0_8px_rgba(0,200,255,0.6)]">
                <Shield className="w-4 h-4 text-neon" />
              </div>
              <div>
                <span className="font-display font-bold text-sm text-neon tracking-widest">KOLLECTION</span>
                <p className="text-[9px] font-mono text-muted-foreground tracking-widest">PARTNER ONBOARDING</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground tracking-widest">STEP {step} OF {TOTAL_STEPS}</span>
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">TELL US ABOUT YOUR COMPANY</h2>
                  <p className="text-sm text-muted-foreground mb-6">Basic information about your lending business</p>
                  <div className="space-y-4">
                    <NeonInput label="Company Name" required value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="e.g. QuickCash Loans Inc." error={errors.companyName} />
                    <NeonInput label="Business License / RBQ Number" value={businessLicense} onChange={(e: any) => setBusinessLicense(e.target.value)} placeholder="e.g. RBQ-2024-XXXXX" />
                    <NeonSelect label="Type of Business" required options={businessTypes} value={businessType} onChange={(e: any) => setBusinessType(e.target.value)} error={errors.businessType} />
                    <NeonInput label="Website URL" value={website} onChange={(e: any) => setWebsite(e.target.value)} placeholder="https://yourcompany.com" error={errors.website} />
                    <NeonInput label="Business Address" value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="123 Main St, Suite 100" />
                    <div className="grid grid-cols-2 gap-4">
                      <NeonInput label="City / Province / State" value={cityProvince} onChange={(e: any) => setCityProvince(e.target.value)} />
                      <NeonSelect label="Country" required options={['Canada', 'USA', 'Other']} value={country} onChange={(e: any) => setCountry(e.target.value)} error={errors.country} />
                    </div>
                    <NeonSelect label="Timezone" options={timezones} value={timezone} onChange={(e: any) => setTimezone(e.target.value)} />
                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-[10px] font-mono text-neon tracking-widest mb-3 uppercase">Primary Contact</p>
                    </div>
                    <NeonInput label="Full Name" required value={contactName} onChange={(e: any) => setContactName(e.target.value)} error={errors.contactName} />
                    <div className="grid grid-cols-2 gap-4">
                      <NeonInput label="Email" required type="email" value={contactEmail} onChange={(e: any) => setContactEmail(e.target.value)} placeholder="you@company.com" error={errors.contactEmail} />
                      <NeonInput label="Phone" required type="tel" value={contactPhone} onChange={(e: any) => setContactPhone(e.target.value)} placeholder="+1 (800) 555-0000" error={errors.contactPhone} />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">YOUR LOAN PORTFOLIO</h2>
                  <p className="text-sm text-muted-foreground mb-6">Help us understand the type of debt we'll be recovering</p>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">
                        Type of Loans You Issue <span className="text-status-red">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {loanTypes.map(lt => (
                          <label key={lt} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all ${
                            selectedLoanTypes.includes(lt) ? 'bg-neon/10 border-neon/30 text-neon' : 'border-border text-muted-foreground hover:border-neon/15'
                          }`}>
                            <input
                              type="checkbox"
                              checked={selectedLoanTypes.includes(lt)}
                              onChange={() => setSelectedLoanTypes(prev => prev.includes(lt) ? prev.filter(x => x !== lt) : [...prev, lt])}
                              className="sr-only"
                            />
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                              selectedLoanTypes.includes(lt) ? 'bg-neon border-neon' : 'border-border'
                            }`}>
                              {selectedLoanTypes.includes(lt) && <Check className="w-2.5 h-2.5 text-background" />}
                            </div>
                            <span className="text-xs">{lt}</span>
                          </label>
                        ))}
                      </div>
                      {errors.loanTypes && <p className="text-[10px] font-mono text-status-red mt-1">{errors.loanTypes}</p>}
                    </div>
                    <SegmentedSelector label="Average Loan Amount" options={avgAmountOptions} value={avgAmount} onChange={setAvgAmount} />
                    <div className="grid grid-cols-2 gap-4">
                      <NeonInput label="Min Single Loan" type="number" value={minLoan} onChange={(e: any) => setMinLoan(e.target.value)} placeholder="200" />
                      <NeonInput label="Max Single Loan" type="number" value={maxLoan} onChange={(e: any) => setMaxLoan(e.target.value)} placeholder="1500" />
                    </div>
                    <SegmentedSelector label="Typical Loan Duration" options={durationOptions} value={loanDuration} onChange={setLoanDuration} />
                    {errors.loanDuration && <p className="text-[10px] font-mono text-status-red -mt-3">{errors.loanDuration}</p>}
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">
                        Average Interest Rate (APR): <span className="text-neon font-bold">{interestRate}%</span>
                      </label>
                      <input type="range" min={0} max={60} value={interestRate} onChange={e => setInterestRate(+e.target.value)}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-[hsl(var(--neon))]"
                        style={{ accentColor: '#00c8ff' }}
                      />
                      <div className="flex justify-between text-[9px] font-mono text-muted-foreground mt-1"><span>0%</span><span>60%</span></div>
                    </div>
                    <NeonTextarea label="Late Fee Policy" value={lateFeePolicy} onChange={(e: any) => setLateFeePolicy(e.target.value)} placeholder="e.g. $25 flat fee after 5 days, then $10/day" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <NeonInput label="Grace Period Before Collections" type="number" value={gracePeriod} onChange={(e: any) => setGracePeriod(e.target.value)} placeholder="14" />
                      </div>
                      <NeonSelect label="Unit" options={['days', 'weeks']} value={gracePeriodUnit} onChange={(e: any) => setGracePeriodUnit(e.target.value)} />
                    </div>
                    <NeonSelect label="Avg Overdue Accounts / Month" required options={monthlyAccountOptions} value={monthlyAccounts} onChange={(e: any) => setMonthlyAccounts(e.target.value)} error={errors.monthlyAccounts} />
                    <NeonInput label="Total Est. Overdue Portfolio / Month ($)" type="number" value={monthlyPortfolio} onChange={(e: any) => setMonthlyPortfolio(e.target.value)} placeholder="45000" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">RECOVERY STRATEGY</h2>
                  <p className="text-sm text-muted-foreground mb-6">Set your rules — our AI will follow them precisely</p>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">
                        Soft Recovery Target: <span className="text-neon font-bold">{softTarget}%</span>
                      </label>
                      <input type="range" min={50} max={100} value={softTarget} onChange={e => setSoftTarget(+e.target.value)}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#00c8ff' }} />
                      <p className="text-xs text-muted-foreground mt-2 bg-deep border border-border rounded-md p-3">
                        At <span className="text-neon font-mono">{softTarget}%</span>, on a <span className="font-mono">$1,000</span> debt you'd receive{' '}
                        <span className="text-status-green font-mono">${Math.round(1000 * (softTarget / 100) * 0.5)}</span> after Kollection's 50% fee
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">
                        Hard Floor (Minimum Accept): <span className="text-neon font-bold">{hardFloor}%</span>
                      </label>
                      <input type="range" min={20} max={70} value={hardFloor} onChange={e => setHardFloor(+e.target.value)}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#00c8ff' }} />
                      <p className="text-xs text-muted-foreground mt-2 bg-deep border border-border rounded-md p-3">
                        Floor set at <span className="text-neon font-mono">{hardFloor}%</span> — AI will never accept less than{' '}
                        <span className="text-status-yellow font-mono">${Math.round(1000 * (hardFloor / 100))}</span> on a $1,000 debt
                      </p>
                    </div>
                    <div className="flex items-center justify-between bg-deep border border-border rounded-md p-4">
                      <div>
                        <p className="text-sm text-foreground">Allow Debt Settlement?</p>
                        <p className="text-[10px] text-muted-foreground">Allow AI to offer lump-sum settlements below full balance</p>
                      </div>
                      <button onClick={() => setAllowSettlement(!allowSettlement)}
                        className={`w-12 h-6 rounded-full transition-all ${allowSettlement ? 'bg-neon shadow-[0_0_8px_rgba(0,200,255,0.6)]' : 'bg-border'}`}>
                        <div className={`w-5 h-5 rounded-full bg-foreground transition-all ${allowSettlement ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between bg-deep border border-border rounded-md p-4">
                      <div>
                        <p className="text-sm text-foreground">Allow Micro-Payments?</p>
                        <p className="text-[10px] text-muted-foreground">Allow debtors to pay in amounts as small as $25</p>
                      </div>
                      <button onClick={() => setAllowMicro(!allowMicro)}
                        className={`w-12 h-6 rounded-full transition-all ${allowMicro ? 'bg-neon shadow-[0_0_8px_rgba(0,200,255,0.6)]' : 'bg-border'}`}>
                        <div className={`w-5 h-5 rounded-full bg-foreground transition-all ${allowMicro ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">
                        Max AI Contact Attempts: <span className="text-neon font-bold">{maxAttempts}</span>
                      </label>
                      <input type="range" min={3} max={20} value={maxAttempts} onChange={e => setMaxAttempts(+e.target.value)}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer" style={{ accentColor: '#00c8ff' }} />
                    </div>
                    <NeonSelect label="Escalate to Human After" options={escalationOptions} value={escalationRule} onChange={(e: any) => setEscalationRule(e.target.value)} />
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">Preferred AI Tone</label>
                      <div className="grid grid-cols-3 gap-3">
                        {toneOptions.map(t => (
                          <button key={t.label} type="button" onClick={() => setAiTone(t.label)}
                            className={`p-4 rounded-lg border text-center transition-all ${
                              aiTone === t.label ? 'bg-neon/10 border-neon/40 shadow-[0_0_12px_rgba(0,200,255,0.4)]' : 'border-border hover:border-neon/20'
                            }`}>
                            <span className="text-2xl block mb-2">{t.emoji}</span>
                            <p className="font-display text-[10px] font-bold tracking-widest text-foreground mb-1">{t.label}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight">{t.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">COMMUNICATION CHANNELS</h2>
                  <p className="text-sm text-muted-foreground mb-6">Configure how the AI will reach your customers</p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <NeonSelect label="SMS Provider" required options={['Twilio', 'Vonage', 'Plivo', "We'll handle it (Kollection)"]} value={smsProvider} onChange={(e: any) => setSmsProvider(e.target.value)} error={errors.smsProvider} />
                      <NeonInput label="SMS Sending Number" value={smsNumber} onChange={(e: any) => setSmsNumber(e.target.value)} placeholder="+1 (800) XXX-XXXX" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <NeonSelect label="Email Provider" required options={['SendGrid', 'Mailgun', "We'll handle it"]} value={emailProvider} onChange={(e: any) => setEmailProvider(e.target.value)} error={errors.emailProvider} />
                      <NeonInput label="Reply-to Email" type="email" value={replyEmail} onChange={(e: any) => setReplyEmail(e.target.value)} placeholder="collections@yourcompany.com" error={errors.replyEmail} />
                    </div>
                    <NeonInput label="Company Display Name (shown in messages)" required value={displayName} onChange={(e: any) => setDisplayName(e.target.value)} placeholder="e.g. QuickCash Collections Team" error={errors.displayName} />
                    <NeonInput label="AI Agent Name" value={agentName} onChange={(e: any) => setAgentName(e.target.value)} placeholder="e.g. Alex" />
                    <p className="text-[10px] text-muted-foreground -mt-2">The name your AI agent will use when introducing itself on calls and in messages</p>
                    <NeonInput label="Business Phone Number" type="tel" value={businessPhone} onChange={(e: any) => setBusinessPhone(e.target.value)} placeholder="+1 (800) XXX-XXXX" />
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">Contact Hours</label>
                      <div className="grid grid-cols-2 gap-4">
                        <NeonInput label="From" type="time" value={contactFrom} onChange={(e: any) => setContactFrom(e.target.value)} />
                        <NeonInput label="To" type="time" value={contactTo} onChange={(e: any) => setContactTo(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">Blackout Days</label>
                      <div className="flex gap-3">
                        {[
                          { label: 'Saturday', checked: blackoutSat, set: setBlackoutSat },
                          { label: 'Sunday', checked: blackoutSun, set: setBlackoutSun },
                          { label: 'Statutory Holidays', checked: blackoutHolidays, set: setBlackoutHolidays },
                        ].map(d => (
                          <label key={d.label} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-all ${
                            d.checked ? 'bg-neon/10 border-neon/30 text-neon' : 'border-border text-muted-foreground'
                          }`}>
                            <input type="checkbox" checked={d.checked} onChange={() => d.set(!d.checked)} className="sr-only" />
                            <div className={`w-3 h-3 rounded border flex items-center justify-center ${d.checked ? 'bg-neon border-neon' : 'border-border'}`}>
                              {d.checked && <Check className="w-2 h-2 text-background" />}
                            </div>
                            <span className="text-xs">{d.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <NeonSelect label="Language" required options={['English', 'French', 'Spanish', 'Bilingual (English + French)']} value={language} onChange={(e: any) => setLanguage(e.target.value)} error={errors.language} />
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">PAYMENT SETUP</h2>
                  <p className="text-sm text-muted-foreground mb-6">Connect your payment processing so recovered funds flow automatically</p>
                  <div className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-3">Payment Processor <span className="text-status-red">*</span></label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { emoji: '💳', label: 'Stripe', desc: 'Recommended — instant setup', value: 'Stripe' },
                          { emoji: '🏦', label: 'Bank Transfer', desc: 'ACH/EFT direct deposit', value: 'Bank Transfer (ACH/EFT)' },
                          { emoji: '🔗', label: 'Custom', desc: 'Our team will contact you', value: 'Custom Integration' },
                        ].map(p => (
                          <button key={p.value} type="button" onClick={() => setPaymentProcessor(p.value)}
                            className={`p-4 rounded-lg border text-center transition-all ${
                              paymentProcessor === p.value ? 'bg-neon/10 border-neon/40 shadow-[0_0_12px_rgba(0,200,255,0.4)]' : 'border-border hover:border-neon/20'
                            }`}>
                            <span className="text-2xl block mb-2">{p.emoji}</span>
                            <p className="font-display text-[10px] font-bold tracking-widest text-foreground mb-0.5">{p.label}</p>
                            <p className="text-[9px] text-muted-foreground">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                      {errors.paymentProcessor && <p className="text-[10px] font-mono text-status-red mt-1">{errors.paymentProcessor}</p>}
                    </div>

                    {paymentProcessor === 'Stripe' && (
                      <div className="space-y-4 bg-deep border border-border rounded-lg p-4">
                        <NeonInput label="Stripe Publishable Key" required value={stripePublic} onChange={(e: any) => setStripePublic(e.target.value)} placeholder="pk_live_..." error={errors.stripePublic} />
                        <NeonInput label="Stripe Secret Key" type="password" value={stripeSecret} onChange={(e: any) => setStripeSecret(e.target.value)} placeholder="sk_live_..." />
                      </div>
                    )}

                    {paymentProcessor === 'Bank Transfer (ACH/EFT)' && (
                      <div className="space-y-4 bg-deep border border-border rounded-lg p-4">
                        <NeonInput label="Bank Name" required value={bankName} onChange={(e: any) => setBankName(e.target.value)} error={errors.bankName} />
                        <NeonInput label="Account Holder Name" value={accountHolder} onChange={(e: any) => setAccountHolder(e.target.value)} />
                        <NeonInput label="Routing Number" required value={routingNumber} onChange={(e: any) => setRoutingNumber(e.target.value)} error={errors.routingNumber} />
                        <NeonInput label="Account Number" type="password" value={accountNumber} onChange={(e: any) => setAccountNumber(e.target.value)} />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <NeonSelect label="Settlement Currency" required options={['CAD', 'USD', 'EUR', 'GBP']} value={currency} onChange={(e: any) => setCurrency(e.target.value)} error={errors.currency} />
                      <SegmentedSelector label="Payout Schedule" options={['Weekly', 'Bi-weekly', 'Monthly']} value={payoutSchedule} onChange={setPayoutSchedule} />
                    </div>

                    {/* Fee agreement */}
                    <label className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                      feeAgreed ? 'bg-neon/5 border-neon/30' : errors.feeAgreed ? 'border-status-red' : 'border-border'
                    }`}>
                      <input type="checkbox" checked={feeAgreed} onChange={() => setFeeAgreed(!feeAgreed)} className="sr-only" />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        feeAgreed ? 'bg-neon border-neon' : 'border-border'
                      }`}>
                        {feeAgreed && <Check className="w-3 h-3 text-background" />}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        I understand and agree that Kollection retains <span className="text-neon font-bold">50%</span> of all successfully recovered amounts. 
                        The remaining 50% is transferred to our settlement account on the selected payout schedule.
                      </p>
                    </label>
                    {errors.feeAgreed && <p className="text-[10px] font-mono text-status-red -mt-3">{errors.feeAgreed}</p>}

                    {/* Fee example card */}
                    <div className="bg-deep border border-neon/20 rounded-lg p-5 shadow-[0_0_12px_rgba(0,200,255,0.15)]">
                      <p className="text-[10px] font-mono text-neon tracking-widest uppercase mb-3">Example Recovery Calculation</p>
                      <div className="space-y-2 font-mono text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Original Debt:</span><span className="text-foreground">$1,200</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Amount Recovered:</span><span className="text-foreground">$960 <span className="text-[10px] text-muted-foreground">(80%)</span></span></div>
                        <div className="border-t border-border my-2" />
                        <div className="flex justify-between"><span className="text-muted-foreground">Kollection Fee (50%):</span><span className="text-neon">$480</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">You Receive (50%):</span><span className="text-status-green">$480</span></div>
                        <div className="border-t border-border my-2" />
                        <div className="flex justify-between"><span className="text-muted-foreground">Net Recovery on Loss:</span><span className="text-foreground font-bold">40%</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div>
                  <h2 className="font-display text-lg font-bold tracking-widest mb-1">REVIEW YOUR SETUP</h2>
                  <p className="text-sm text-muted-foreground mb-6">Confirm your details before we activate your account</p>
                  <div className="space-y-4">
                    {[
                      { title: 'Company Info', step: 1, items: [
                        ['Company', companyName], ['Type', businessType], ['Contact', contactName], ['Email', contactEmail], ['Country', country],
                      ]},
                      { title: 'Loan Portfolio', step: 2, items: [
                        ['Loan Types', selectedLoanTypes.join(', ') || '—'], ['Avg Amount', avgAmount], ['Duration', loanDuration || '—'], ['Monthly Volume', monthlyAccounts || '—'],
                      ]},
                      { title: 'Recovery Strategy', step: 3, items: [
                        ['Target', `${softTarget}%`], ['Floor', `${hardFloor}%`], ['Tone', aiTone], ['Max Attempts', maxAttempts.toString()],
                      ]},
                      { title: 'Communication', step: 4, items: [
                        ['SMS', smsProvider || '—'], ['Display Name', displayName || '—'], ['Agent Name', agentName || '—'], ['Hours', `${contactFrom}–${contactTo}`],
                      ]},
                      { title: 'Payment', step: 5, items: [
                        ['Processor', paymentProcessor || '—'], ['Currency', currency || '—'], ['Payout', payoutSchedule],
                      ]},
                    ].map(section => (
                      <div key={section.title} className="bg-deep border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-mono text-neon tracking-widest uppercase">{section.title}</p>
                          <button onClick={() => goToStep(section.step)} className="text-[10px] font-mono text-neon hover:text-neon/80 tracking-widest uppercase">Edit</button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {section.items.map(([label, value]) => (
                            <div key={label as string}>
                              <p className="text-[9px] font-mono text-muted-foreground tracking-widest">{label}</p>
                              <p className="text-xs text-foreground truncate">{value as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <NeonButton variant="outline" onClick={prevStep}><ChevronLeft className="w-3 h-3" /> Back</NeonButton>
            ) : (
              <Link to="/"><NeonButton variant="outline">Cancel</NeonButton></Link>
            )}
            <NeonButton variant="solid" onClick={nextStep}>
              {step === 6 ? (
                <>Activate My Kollection Account <ArrowRight className="w-3 h-3" /></>
              ) : (
                <>Continue <ChevronRight className="w-3 h-3" /></>
              )}
            </NeonButton>
          </div>

          {step === 6 && (
            <p className="text-[9px] text-muted-foreground text-center mt-4 leading-relaxed">
              By submitting, you agree to Kollection's Terms of Service, Privacy Policy, and the 50/50 Revenue Share Agreement. 
              Your account will be reviewed within 1 business day.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
