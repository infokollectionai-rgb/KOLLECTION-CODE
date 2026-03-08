import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Check, ArrowRight, ArrowLeft, Building2, User, Mail, Lock, CreditCard } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  { label: 'Company', icon: Building2 },
  { label: 'Contact', icon: User },
  { label: 'Portfolio', icon: CreditCard },
  { label: 'AI Config', icon: Mail },
  { label: 'Confirm', icon: Lock },
];

export default function SignupWizard() {
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    companyName: '', industry: 'Medical', website: '',
    firstName: '', lastName: '', email: '', phone: '',
    portfolioSize: '', avgDebt: '', debtTypes: '',
    tone: 'professional', maxAttempts: '10', channels: ['sms', 'email'],
  });

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
    else {
      setComplete(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    }
  };

  if (complete) {
    return (
      <div className="min-h-screen flex items-center justify-center neon-grid-bg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,255,0.08)_0%,transparent_60%)]" />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="relative z-10 text-center"
        >
          <div className="w-24 h-24 rounded-full border-2 border-neon bg-neon/10 flex items-center justify-center mx-auto mb-6 animate-neon-pulse neon-glow-lg">
            <Check className="w-12 h-12 text-neon" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-widest text-foreground mb-2">ACCOUNT CREATED</h2>
          <p className="text-muted-foreground mb-4">Your AI agents are initializing...</p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-neon"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center neon-grid-bg relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,255,0.08)_0%,transparent_60%)]" />
      <div className="relative z-10 w-full max-w-lg px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-neon/20 flex items-center justify-center neon-glow-md mx-auto mb-4">
            <Shield className="w-6 h-6 text-neon" />
          </div>
          <h1 className="font-display text-lg font-bold tracking-widest text-neon neon-text-glow">CREATE ACCOUNT</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all ${
                i < step ? 'bg-neon text-primary-foreground neon-glow-sm' :
                i === step ? 'border-2 border-neon text-neon neon-glow-sm' :
                'border border-border text-muted-foreground'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 lg:w-16 h-px mx-1 transition-all ${i < step ? 'bg-neon neon-glow-sm' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-panel border border-neon/20 rounded-xl p-8 neon-glow-sm">
          <div className="flex items-center gap-2 mb-6">
            {(() => { const Icon = steps[step].icon; return <Icon className="w-4 h-4 text-neon" />; })()}
            <h2 className="font-display text-sm font-bold tracking-widest">{steps[step].label.toUpperCase()}</h2>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{step + 1}/{steps.length}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {step === 0 && (
                <>
                  <Field label="Company Name" value={form.companyName} onChange={v => update('companyName', v)} placeholder="MediCredit Corp" />
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">Industry</label>
                    <select value={form.industry} onChange={e => update('industry', e.target.value)} className="w-full bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all">
                      {['Medical', 'Financial', 'Retail', 'Utilities', 'Other'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <Field label="Website" value={form.website} onChange={v => update('website', v)} placeholder="https://medicredit.com" />
                </>
              )}
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First Name" value={form.firstName} onChange={v => update('firstName', v)} placeholder="John" />
                    <Field label="Last Name" value={form.lastName} onChange={v => update('lastName', v)} placeholder="Smith" />
                  </div>
                  <Field label="Email" value={form.email} onChange={v => update('email', v)} placeholder="john@medicredit.com" type="email" />
                  <Field label="Phone" value={form.phone} onChange={v => update('phone', v)} placeholder="+1 (555) 123-4567" />
                </>
              )}
              {step === 2 && (
                <>
                  <Field label="Portfolio Size (# of accounts)" value={form.portfolioSize} onChange={v => update('portfolioSize', v)} placeholder="500" type="number" />
                  <Field label="Average Debt Amount" value={form.avgDebt} onChange={v => update('avgDebt', v)} placeholder="$5,000" />
                  <Field label="Debt Types" value={form.debtTypes} onChange={v => update('debtTypes', v)} placeholder="Medical bills, personal loans..." />
                </>
              )}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">AI Communication Tone</label>
                    <div className="flex gap-2">
                      {['professional', 'firm', 'empathetic'].map(t => (
                        <button key={t} onClick={() => update('tone', t)}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-bold tracking-widest uppercase transition-all border ${
                            form.tone === t ? 'bg-neon/20 text-neon border-neon/40 neon-glow-sm' : 'border-border text-muted-foreground hover:text-foreground'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">Outreach Channels</label>
                    <div className="flex gap-2">
                      {['sms', 'email', 'voice'].map(ch => (
                        <button key={ch} onClick={() => update('channels', form.channels.includes(ch) ? form.channels.filter((c: string) => c !== ch) : [...form.channels, ch])}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-bold tracking-widest uppercase transition-all border ${
                            form.channels.includes(ch) ? 'bg-neon/20 text-neon border-neon/40 neon-glow-sm' : 'border-border text-muted-foreground hover:text-foreground'
                          }`}>{ch}</button>
                      ))}
                    </div>
                  </div>
                  <Field label="Max AI Attempts per Account" value={form.maxAttempts} onChange={v => update('maxAttempts', v)} placeholder="10" type="number" />
                </>
              )}
              {step === 4 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-4">Review Your Configuration</p>
                  {[
                    ['Company', form.companyName || '—'],
                    ['Industry', form.industry],
                    ['Contact', `${form.firstName} ${form.lastName}`.trim() || '—'],
                    ['Email', form.email || '—'],
                    ['Portfolio', form.portfolioSize ? `${form.portfolioSize} accounts` : '—'],
                    ['AI Tone', form.tone],
                    ['Channels', form.channels.join(', ').toUpperCase()],
                    ['Max Attempts', form.maxAttempts],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">{k}</span>
                      <span className="text-sm font-mono text-foreground">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <NeonButton variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-3 h-3" /> Back
              </NeonButton>
            )}
            <NeonButton variant="solid" className="flex-1" onClick={handleNext}>
              {step === 4 ? 'Create Account' : 'Continue'} <ArrowRight className="w-3 h-3" />
            </NeonButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground font-body placeholder:text-muted-foreground/40 focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all"
      />
    </div>
  );
}
