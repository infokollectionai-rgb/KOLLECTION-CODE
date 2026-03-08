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
  { num: '01', title: 'Submit your overdue accounts', desc: 'Upload a CSV or connect your loan management system. We import and categorize your accounts automatically.' },
  { num: '02', title: 'AI begins outreach immediately', desc: 'Our system contacts debtors via SMS, email, and phone. It negotiates payments, sets up installment plans, and tracks promises.' },
  { num: '03', title: 'You receive 50% of every dollar collected', desc: 'Recovered funds are transferred to your bank account on your chosen schedule — weekly, bi-weekly, or monthly.' },
];

const testimonials = [
  { quote: 'We recovered $42,000 in the first month alone. The AI handles everything — we just watch the dashboard.', name: 'Sarah J.', company: 'QuickCash Loans', role: 'Operations Director', rating: 5 },
  { quote: "No more hiring collection agents. Kollection's system is faster, cheaper, and more compliant than anything we've used.", name: 'Mike C.', company: 'EasyPay Lending', role: 'CEO', rating: 5 },
  { quote: 'The 50/50 model means they\'re incentivized to actually collect. Our recovery rate went from 12% to 36%.', name: 'Amy W.', company: 'TrustBridge Financial', role: 'VP Collections', rating: 5 },
];

const faqs = [
  { q: 'How does pricing work?', a: 'Simple — a one-time $299 setup fee, then 50% of everything we recover. If we collect nothing, you pay nothing beyond the setup.' },
  { q: 'What types of loans do you support?', a: 'Payday loans, personal installment loans, auto title loans, cash advances, lines of credit, and more. If someone owes you money, we can recover it.' },
  { q: 'How quickly will you contact my debtors?', a: 'Most accounts receive their first outreach within 48 hours of being uploaded to the platform.' },
  { q: 'Can I take manual control of an account?', a: 'Yes. You can request manual takeover on any account at any time through the dashboard. AI recovery pauses and our team coordinates with you.' },
  { q: 'Is the AI outreach compliant with collection laws?', a: 'Absolutely. All communications follow federal and provincial regulations including contact hour restrictions, required disclosures, and opt-out handling.' },
  { q: 'How do I receive my payouts?', a: 'Via Stripe Connect or direct bank transfer (ACH/EFT). You choose weekly, bi-weekly, or monthly payouts during onboarding.' },
];

const feeExamples = [
  { recovered: 500, yours: 250, ours: 250 },
  { recovered: 800, yours: 400, ours: 400 },
  { recovered: 1200, yours: 600, ours: 600 },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neon/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-neon" />
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
            <Link to="/signup"><NeonButton variant="solid" size="sm">Get Started</NeonButton></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(205_100%_50%_/_0.04)_0%,_transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-panel text-xs text-muted-foreground mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-status-green animate-pulse" />
            AI-powered debt recovery for lending companies
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] text-foreground mb-6 tracking-tight">
            Stop Writing Off<br />
            <span className="text-neon">Bad Debt.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Kollection's AI contacts your overdue borrowers by SMS, email, and phone — negotiates payments, 
            sets up installment plans, and recovers your money. You keep 50% of everything collected.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/signup">
              <NeonButton variant="solid" className="text-base px-8 py-3">
                Start Recovering Now <ArrowRight className="w-4 h-4" />
              </NeonButton>
            </Link>
            <a href="#how-it-works">
              <NeonButton className="text-base px-8 py-3">See How It Works</NeonButton>
            </a>
          </div>

          {/* Stats bar */}
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

      {/* Social proof strip */}
      <section className="border-y border-border bg-panel/50 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-neon" />
          Trusted by payday lenders, personal loan providers, and credit unions across North America
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">Everything You Need to Recover Outstanding Loans</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Our AI handles the outreach. You monitor the results. No collection staff required.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-panel border border-border rounded-xl p-6 hover:border-neon/15 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-neon/8 flex items-center justify-center mb-4 group-hover:bg-neon/12 transition-colors">
                  <f.icon className="w-5 h-5 text-neon" />
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
            {steps.map((item, i) => (
              <div key={item.num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-neon/8 border border-neon/15 flex items-center justify-center">
                  <span className="font-mono text-neon font-semibold text-sm">{item.num}</span>
                </div>
                <div className="pt-1">
                  <h3 className="text-base font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/signup">
              <NeonButton variant="solid">Apply for an Account <ArrowRight className="w-3 h-3" /></NeonButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 border-t border-border">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-3">Simple, Performance-Based Pricing</h2>
            <p className="text-muted-foreground">We only earn when you earn. No monthly fees. No contracts.</p>
          </div>

          <div className="bg-panel border border-border rounded-xl p-8 md:p-10 mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="space-y-4 mb-6">
                  {[
                    { label: 'Setup fee', value: '$299 one-time' },
                    { label: 'Recovery fee', value: '50% of collected amounts' },
                    { label: 'Monthly fee', value: '$0' },
                    { label: 'Contracts', value: 'None' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground font-mono">{item.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  If we collect $0, you owe $0 beyond the one-time setup. Our AI is incentivized to recover as much as possible.
                </p>
              </div>

              <div className="bg-raised border border-border rounded-lg p-5">
                <p className="text-[11px] text-muted-foreground mb-4 font-mono tracking-wide">EXAMPLE RECOVERIES</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 text-[10px] text-muted-foreground pb-2 border-b border-border">
                    <span>RECOVERED</span><span className="text-center">YOU GET</span><span className="text-right">WE GET</span>
                  </div>
                  {feeExamples.map(ex => (
                    <div key={ex.recovered} className="grid grid-cols-3 text-sm font-mono">
                      <span className="text-foreground">${ex.recovered}</span>
                      <span className="text-center text-status-green">${ex.yours}</span>
                      <span className="text-right text-muted-foreground">${ex.ours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link to="/signup">
              <NeonButton variant="solid" className="text-base px-8 py-3">
                Start Recovering Now <ArrowRight className="w-4 h-4" />
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
              <div key={i} className="bg-panel border border-border rounded-xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-status-yellow fill-status-yellow" />
                  ))}
                </div>
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
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-panel/50 transition-colors"
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
              Start Your Free Application <ArrowRight className="w-4 h-4" />
            </NeonButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-neon" />
                <span className="font-semibold text-foreground">Kollection</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">AI-powered debt recovery for lending companies across North America.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Product</p>
              <div className="space-y-2">
                <a href="#features" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#how-it-works" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Company</p>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Careers</a>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-3">Legal</p>
              <div className="space-y-2">
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="block text-xs text-muted-foreground hover:text-foreground transition-colors">Compliance</a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2025 Kollection. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">partners@kollection.io</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
