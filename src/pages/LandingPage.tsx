import { Link } from 'react-router-dom';
import { Shield, ArrowRight, CheckCircle } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-panel/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-neon/10 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-neon" />
            </div>
            <span className="font-semibold text-sm text-foreground">Kollection</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login"><NeonButton size="sm">Sign In</NeonButton></Link>
            <Link to="/onboarding"><NeonButton variant="solid" size="sm">Apply Now</NeonButton></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
            We Recover Your<br />Outstanding Loans.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            AI-powered outreach contacts your overdue accounts by SMS, email, and phone. 
            You track the results. We split what we collect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/onboarding"><NeonButton variant="solid">Apply for an Account <ArrowRight className="w-3 h-3" /></NeonButton></Link>
            <a href="#how-it-works"><NeonButton>See How It Works</NeonButton></a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center mb-16 text-foreground">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { step: '01', title: 'Submit your overdue accounts', desc: 'Upload a CSV or connect your system. We import your accounts immediately.' },
              { step: '02', title: 'AI contacts your debtors', desc: 'Our system reaches out via SMS, email, and phone calls. You watch the progress in real time.' },
              { step: '03', title: 'You receive 50% of everything collected', desc: 'Funds are transferred to your account on your chosen schedule.' },
            ].map(item => (
              <div key={item.step}>
                <span className="font-mono text-neon text-sm">{item.step}</span>
                <h3 className="text-base font-semibold text-foreground mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-3">How We Charge</h2>
          <div className="mt-8 space-y-4 text-left max-w-md mx-auto">
            {[
              'One-time setup fee to activate your account.',
              'Then 50% of everything we recover — that\'s it.',
              'If we collect $0, you owe $0.',
            ].map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="w-4 h-4 text-neon flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{line}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/onboarding">
              <NeonButton variant="solid">Apply for an Account <ArrowRight className="w-3 h-3" /></NeonButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-semibold text-center mb-12 text-foreground">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: 'We recovered $42,000 in the first month alone. The AI handles everything — we just watch the dashboard.', name: 'Sarah J.', company: 'QuickCash Loans' },
              { quote: 'No more hiring collection agents. Kollection\'s system is faster, cheaper, and more compliant than anything we\'ve used.', name: 'Mike C.', company: 'EasyPay Lending' },
              { quote: 'The 50/50 model means they\'re incentivized to actually collect. Our recovery rate went from 12% to 36%.', name: 'Amy W.', company: 'TrustBridge' },
            ].map((t, i) => (
              <div key={i} className="bg-panel border border-border rounded-lg p-5">
                <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-xs text-muted-foreground">{t.name}, {t.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-neon" />
            <span className="text-sm text-foreground">Kollection</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Kollection. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
