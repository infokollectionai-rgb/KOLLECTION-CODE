import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle, BarChart3, MessageSquare, Clock, DollarSign, Users, Zap, ChevronDown, Star } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { useState } from 'react';

const stats = [
  { value: '$2.4M+', label: 'Recovered for clients' },
  { value: '36%', label: 'Avg recovery rate' },
  { value: '48hrs', label: 'Avg first contact' },
  { value: '180+', label: 'Active accounts managed' },
];

const features = [
  { icon: MessageSquare, title: 'Multi-Channel AI Outreach', desc: 'SMS, email, and phone calls — all automated. Our AI adapts tone and timing to maximize response rates.' },
  { icon: BarChart3, title: 'Real-Time Recovery Dashboard', desc: 'Track every account, payment, and conversation as it happens. Full transparency into your portfolio.' },
  { icon: Clock, title: 'Instant Account Onboarding', desc: 'Upload a CSV or connect via API. Your overdue accounts enter the recovery pipeline within minutes.' },
  { icon: DollarSign, title: 'Automated Payment Collection', desc: 'Installment plans, settlements, and full payments processed automatically. Funds flow to your account on schedule.' },
  { icon: Users, title: 'Human Escalation When Needed', desc: 'Complex cases get flagged for manual review. Request takeover on any account with one click.' },
  { icon: Zap, title: 'Compliance Built In', desc: 'All outreach follows federal and provincial collection regulations. Configurable contact windows and blackout periods.' },
];

const steps = [
  { num: '01', title: 'Submit your overdue accounts', desc: 'Upload a list of overdue accounts. We import them within 24 hours.' },
  { num: '02', title: 'AI handles outreach', desc: 'SMS, email, and phone calls go out automatically. You monitor progress in real time.' },
  { num: '03', title: 'Receive your 50%', desc: 'Every dollar collected is split 50/50. Transferred on your chosen schedule.' },
];

const testimonials = [
  { quote: 'We recovered $42,000 in the first month alone. The AI handles everything — we just watch the dashboard.', name: 'Sarah J.', company: 'QuickCash Loans', role: 'Operations Director' },
  { quote: "No more hiring collection agents. Kollection's system is faster, cheaper, and more compliant than anything we've used.", name: 'Mike C.', company: 'EasyPay Lending', role: 'CEO' },
  { quote: 'The 50/50 model means they\'re incentivized to actually collect. Our recovery rate went from 12% to 36%.', name: 'Amy W.', company: 'TrustBridge Financial', role: 'VP Collections' },
];

const faqs = [
  { q: 'How does pricing work?', a: 'Simple — a one-time $299 setup fee, then 50% of everything we recover. If we collect nothing, you pay nothing beyond the setup.' },
  { q: 'What types of loans do you support?', a: 'Payday loans, personal installment loans, auto title loans, cash advances, lines of credit, and more. If someone owes you money, we can recover it.' },
  { q: 'How quickly will you contact my debtors?', a: 'Most accounts receive their first outreach within 48 hours of being uploaded to the platform.' },
  { q: 'Can I take manual control of an account?', a: 'Yes. You can request manual takeover on any account at any time through the dashboard. AI recovery pauses and our team coordinates with you.' },
  { q: 'Is the AI outreach compliant with collection laws?', a: 'Absolutely. All communications follow federal and provincial regulations including contact hour restrictions, required disclosures, and opt-out handling.' },
  { q: 'How do I receive my payouts?', a: 'Via Stripe Connect or direct bank transfer (ACH/EFT). You choose weekly, bi-weekly, or monthly payouts during onboarding.' },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Kollection</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><NeonButton size="sm">Sign In</NeonButton></Link>
            <Link to="/signup"><NeonButton variant="solid" size="sm">Apply for Account</NeonButton></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(205_100%_50%_/_0.04)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6 tracking-tight">
            We Recover Your<br />Outstanding Loans.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered outreach contacts your overdue accounts by SMS, email, and phone.
            You track the results. We split what we collect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/signup">
              <NeonButton variant="solid" className="text-base px-8 py-3">
                Apply for an Account <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </Link>
            <a href="#how-it-works">
              <NeonButton className="text-base px-8 py-3">See How It Works</NeonButton>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold font-mono text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything You Need to Recover Outstanding Loans</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Our AI handles the outreach. You monitor the results. No collection staff required.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-card border border-border rounded-xl p-6 hover:border-primary/15 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/8 flex items-center justify-center mb-4 group-hover:bg-primary/12 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three steps. No complexity.</p>
          </div>
          <div className="space-y-8">
            {steps.map(item => (
              <div key={item.num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                  <span className="font-mono text-primary font-semibold text-sm">{item.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">How We Charge</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              One-time setup fee to activate your account.<br />
              Then 50% of every dollar we recover — that's it.<br />
              If we collect $0, you owe $0.
            </p>
          </div>
          <div className="text-center">
            <Link to="/signup">
              <NeonButton variant="solid" className="text-base px-8 py-3">
                Apply for an Account <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">What Our Clients Say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}, {t.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-card/50 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Stop Writing Off Bad Debt?</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            Sign up in 4 steps. No contracts. No upfront cost beyond setup.<br />
            We recover your money — you keep 50% of every dollar we bring back.
          </p>
          <Link to="/signup">
            <NeonButton variant="solid" className="text-base px-8 py-3">
              Start Your Application <ArrowRight className="w-4 h-4" />
            </NeonButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Kollection</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Security</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
            <span>partners@kollection.io</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Kollection Inc.</p>
        </div>
      </footer>

      {/* Demo Access Card */}
      <div className="fixed bottom-5 right-5 z-50 bg-card border border-border rounded-lg p-4 w-[280px] shadow-lg">
        <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">DEMO ACCESS</p>
        <div className="space-y-2.5 text-xs">
          <div>
            <p className="text-muted-foreground mb-0.5">Admin</p>
            <p className="font-mono text-foreground">admin@kollection.ca</p>
            <p className="font-mono text-muted-foreground">Admin2025!</p>
          </div>
          <div className="border-t border-border pt-2">
            <p className="text-muted-foreground mb-0.5">Client</p>
            <p className="font-mono text-foreground">demo@quickcashloans.ca</p>
            <p className="font-mono text-muted-foreground">Demo2025!</p>
          </div>
        </div>
        <Link to="/login" className="block mt-3">
          <NeonButton variant="solid" size="sm" className="w-full text-[11px]">Sign In to Demo</NeonButton>
        </Link>
      </div>
    </div>
  );
}
