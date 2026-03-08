import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Bot, Zap, Phone, BarChart3, CreditCard, ArrowRight, CheckCircle, AlertTriangle, TrendingDown, Clock, Target, Users, LineChart } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { useEffect, useState } from 'react';

function AnimatedCounter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const increment = target / 50;
    const interval = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(interval); }
      else setCount(Math.floor(current));
    }, 30);
    return () => clearInterval(interval);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const features = [
  { icon: Bot, title: 'AI Outreach Engine', desc: 'Automated SMS, email, and voice campaigns that adapt to debtor behavior in real-time.' },
  { icon: Zap, title: 'Smart Negotiation', desc: 'AI-driven negotiation scripts that optimize settlement rates and minimize write-offs.' },
  { icon: Phone, title: 'Voice AI Calls', desc: 'Natural-sounding AI voice calls that negotiate, confirm, and collect — 24/7.' },
  { icon: BarChart3, title: 'Risk Scoring', desc: 'Behavioral risk models that tier accounts and prioritize recovery actions.' },
  { icon: CreditCard, title: 'Instant Payment Links', desc: 'One-click payment links with QR codes. Reduce friction to zero.' },
  { icon: Shield, title: 'Human Takeover', desc: 'Seamless escalation to human agents with full AI context and transcript.' },
];

const problems = [
  { icon: TrendingDown, title: 'Write-Off Spiral', desc: 'Traditional agencies recover less than 20% of assigned debt. The rest? Written off as losses eating directly into your bottom line.' },
  { icon: Clock, title: 'Slow & Expensive', desc: 'Manual calling centers burn cash — $15-25 per contact attempt. Agents handle 30-40 calls a day. Math doesn\'t work at scale.' },
  { icon: AlertTriangle, title: 'Compliance Risk', desc: 'One wrong call at the wrong time. One aggressive message. TCPA violations cost $500-$1,500 per incident. The risk is constant.' },
];

const pricing = [
  { name: 'Starter', price: '$499', period: '/mo', features: ['Up to 100 accounts', 'SMS + Email outreach', 'Basic analytics', 'Standard support'], featured: false },
  { name: 'Performance', price: '$1,499', period: '/mo', features: ['Up to 1,000 accounts', 'All channels + Voice AI', 'Advanced analytics + Heatmaps', 'Priority support', 'Custom AI tone'], featured: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited accounts', 'Full API access', 'Dedicated success manager', 'Custom integrations', 'SLA guarantee'], featured: false },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-deep/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-neon/20 flex items-center justify-center neon-glow-sm">
              <Shield className="w-4 h-4 text-neon" />
            </div>
            <span className="font-display font-bold text-sm text-neon neon-text-glow tracking-widest">KOLLECTION</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#problem" className="hover:text-neon transition-colors">Problem</a>
            <a href="#solution" className="hover:text-neon transition-colors">Solution</a>
            <a href="#features" className="hover:text-neon transition-colors">Features</a>
            <a href="#pricing" className="hover:text-neon transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <NeonButton variant="outline" size="sm">Login</NeonButton>
            </Link>
            <Link to="/signup">
              <NeonButton variant="solid" size="sm">Request Demo</NeonButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center neon-grid-bg overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,255,0.12)_0%,transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 pt-20 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
              REDUCE WRITE-OFFS.<br />
              <span className="text-neon neon-text-glow">MAXIMIZE RECOVERY.</span>
            </h1>
            <p className="text-lg text-muted-foreground font-light mb-8 max-w-lg">
              Kollection's AI agents negotiate, track, and close debt 24/7 — across SMS, voice, and email.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup"><NeonButton variant="solid">Request Demo</NeonButton></Link>
              <Link to="/dashboard"><NeonButton variant="outline">View Platform <ArrowRight className="w-3 h-3" /></NeonButton></Link>
            </div>
            <div className="flex gap-8 mt-12">
              {[
                { value: 12, prefix: '$', suffix: 'M+', label: 'Recovered' },
                { value: 94, suffix: '%', label: 'AI Resolution' },
                { value: 40, suffix: '+', label: 'Lenders' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="font-display text-2xl font-bold text-neon neon-text-glow">
                    <AnimatedCounter target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                  </p>
                  <p className="text-[11px] font-mono text-muted-foreground tracking-widest uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="animate-float bg-panel border border-neon/30 rounded-xl p-6 neon-glow-md max-w-sm ml-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-muted-foreground tracking-widest">LIVE RECOVERY</span>
                <span className="w-2 h-2 rounded-full bg-status-green animate-pulse-green" />
              </div>
              <div className="space-y-3">
                {['Marcus Allen — $4,200', 'Priya Nair — $11,800', 'Laura Chen — $3,100'].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border">
                    <span className="text-sm text-foreground">{item.split(' — ')[0]}</span>
                    <span className="font-mono text-sm text-neon">{item.split(' — ')[1]}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-1 bg-border rounded overflow-hidden">
                <div className="h-full bg-neon rounded neon-glow-sm w-[72%]" />
              </div>
              <p className="text-[10px] font-mono text-muted-foreground mt-2">72% RECOVERY RATE</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 bg-[#0f0608]">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-2xl font-bold text-center mb-4 tracking-widest">THE PROBLEM</h2>
            <p className="text-center text-status-red/70 mb-16 max-w-2xl mx-auto text-sm">
              Debt recovery is broken. The industry loses billions annually to outdated processes.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {problems.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-status-red/[0.03] border border-status-red/10 rounded-xl p-6 hover:border-status-red/25 transition-all"
              >
                <p.icon className="w-6 h-6 text-status-red mb-4" />
                <h3 className="font-display text-sm font-bold tracking-widest mb-2 text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-24 bg-base">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <span className="text-[10px] font-mono text-neon tracking-widest uppercase mb-4 block">The Solution</span>
            <h2 className="font-display text-3xl font-bold tracking-widest text-foreground mb-6">
              AI AGENTS THAT<br />
              <span className="text-neon neon-text-glow">NEVER SLEEP.</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Kollection deploys intelligent AI agents across every communication channel. They learn debtor behavior, 
              optimize negotiation strategies, and close recoveries — autonomously.
            </p>
            <div className="space-y-4">
              {[
                { icon: Target, text: 'Behavioral risk scoring prioritizes high-probability accounts' },
                { icon: Users, text: 'Multi-channel outreach: SMS, voice calls, and email in harmony' },
                { icon: LineChart, text: 'Real-time analytics dashboards with actionable insights' },
                { icon: Shield, text: 'TCPA-compliant with built-in blackout hours and consent tracking' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-md bg-neon/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-neon" />
                  </div>
                  <p className="text-sm text-foreground">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Animated Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden lg:block"
          >
            <div className="bg-panel border border-neon/20 rounded-xl p-6 neon-glow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-status-red" />
                <span className="w-2 h-2 rounded-full bg-status-yellow" />
                <span className="w-2 h-2 rounded-full bg-status-green" />
                <span className="ml-2 font-mono text-[10px] text-muted-foreground tracking-widest">COMMAND CENTER</span>
              </div>

              {/* Mini KPI Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Recovered', value: '$1.8M', color: 'text-status-green' },
                  { label: 'Rate', value: '94%', color: 'text-neon' },
                  { label: 'Active', value: '847', color: 'text-foreground' },
                ].map((kpi, i) => (
                  <div key={i} className="bg-deep rounded-lg p-3 border border-border">
                    <p className="text-[8px] font-mono text-muted-foreground tracking-widest">{kpi.label}</p>
                    <p className={`font-display text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Mini chart bars */}
              <div className="flex items-end gap-1 h-20 mb-4">
                {[40, 65, 55, 80, 70, 90, 85, 75, 95, 60, 88, 72].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-neon/30 rounded-t-sm"
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05, duration: 0.5 }}
                    style={{ boxShadow: h > 80 ? '0 0 6px rgba(0,200,255,0.6)' : 'none' }}
                  />
                ))}
              </div>

              {/* Mini activity */}
              <div className="space-y-2">
                {[
                  { text: 'AI sent SMS to Marcus Allen', badge: 'SUCCESS' },
                  { text: 'Voice call completed — Priya Nair', badge: 'PROMISE' },
                  { text: 'Payment link opened — Laura Chen', badge: 'ACTIVE' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 text-[11px]">
                    <span className="text-muted-foreground">{item.text}</span>
                    <span className="font-mono text-[9px] text-neon tracking-widest">{item.badge}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-deep">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-center mb-4 tracking-widest">AI-POWERED FEATURES</h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">Every feature is backed by intelligent agents that learn, adapt, and optimize recovery outcomes.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-panel border border-border rounded-xl p-6 hover:border-neon/30 hover:shadow-[0_0_8px_rgba(0,200,255,0.6)] transition-all group"
              >
                <f.icon className="w-6 h-6 text-neon mb-4 group-hover:drop-shadow-[0_0_8px_rgba(0,200,255,0.8)]" />
                <h3 className="font-display text-sm font-bold tracking-widest mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl font-bold text-center mb-16 tracking-widest">PRICING</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`bg-panel rounded-xl p-8 border ${p.featured ? 'border-neon neon-glow-md' : 'border-border'}`}
              >
                <h3 className="font-display text-sm font-bold tracking-widest mb-1">{p.name}</h3>
                <p className="font-display text-3xl font-bold text-foreground mb-1">
                  {p.price}<span className="text-sm text-muted-foreground font-body">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-neon flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link to="/signup">
                    <NeonButton variant={p.featured ? 'solid' : 'outline'} className="w-full">
                      {p.featured ? 'Get Started' : 'Contact Us'}
                    </NeonButton>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-deep border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-neon" />
                <span className="font-display text-xs text-neon tracking-widest">KOLLECTION</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered debt recovery that never sleeps.</p>
            </div>
            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 uppercase">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/dashboard" className="text-muted-foreground hover:text-neon transition-colors">Dashboard</Link></li>
                <li><a href="#features" className="text-muted-foreground hover:text-neon transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-neon transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 uppercase">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">About</span></li>
                <li><span className="text-muted-foreground">Careers</span></li>
                <li><span className="text-muted-foreground">Contact</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 uppercase">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><span className="text-muted-foreground">Privacy Policy</span></li>
                <li><span className="text-muted-foreground">Terms of Service</span></li>
                <li><span className="text-muted-foreground">Compliance</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
              © 2025 KOLLECTION. ALL RIGHTS RESERVED.
            </p>
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest">
              POWERED BY KOLLECTION AI ENGINE V2
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
