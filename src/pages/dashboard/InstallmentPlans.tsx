import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockInstallments } from '@/data/mockData';
import { useNegotiation } from '@/services/ai/agentHooks';
import { generateInstallmentOptions } from '@/services/ai/agentService';
import { X, Bot, Check, Clock, AlertCircle } from 'lucide-react';

export default function InstallmentPlans() {
  const [selected, setSelected] = useState<typeof mockInstallments[0] | null>(null);
  const [aiOptions, setAiOptions] = useState<any[] | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const handleGetOptions = async () => {
    if (!selected) return;
    setLoadingOptions(true);
    try {
      const result = await generateInstallmentOptions({
        debtorId: selected.debtorId,
        totalDebt: selected.totalAmount,
        floorAmount: selected.totalAmount * 0.5,
        tier: 2,
      });
      setAiOptions(result.options);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Generate mock payment timeline
  const getTimeline = (inst: typeof mockInstallments[0]) => {
    const timeline = [];
    for (let i = 0; i < inst.paymentsTotal; i++) {
      const isPaid = i < inst.paymentsMade;
      const isMissed = !isPaid && i === inst.paymentsMade && inst.status === 'Behind';
      timeline.push({
        index: i + 1,
        amount: inst.planAmount,
        status: isPaid ? 'paid' : isMissed ? 'missed' : 'upcoming',
        date: new Date(2025, 1 + i, 15).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      });
    }
    return timeline;
  };

  return (
    <PageWrapper title="Installment Plans">
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Debtor', 'Total', 'Paid', 'Plan Amt', 'Progress', 'Status', 'Next Due'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInstallments.map(inst => {
              const pct = Math.round((inst.paymentsMade / inst.paymentsTotal) * 100);
              return (
                <tr key={inst.id} onClick={() => { setSelected(inst); setAiOptions(null); }} className="border-b border-border/30 hover:bg-neon/5 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{inst.id}</td>
                  <td className="px-4 py-3 text-foreground font-semibold">{inst.debtor}</td>
                  <td className="px-4 py-3 font-mono text-neon">${inst.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-status-green">${inst.paidAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">${inst.planAmount}/mo</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-border rounded overflow-hidden">
                        <div className="h-full bg-neon rounded neon-glow-sm" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground w-8">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><NeonBadge variant={inst.status === 'Active' ? 'green' : 'red'}>{inst.status}</NeonBadge></td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">{inst.nextDue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Side Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-panel border-l border-neon/20 animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-sm font-bold tracking-widest">{selected.debtor}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-deep rounded-lg p-3">
                  <p className="text-[9px] font-mono text-muted-foreground tracking-widest">Total</p>
                  <p className="font-mono text-neon">${selected.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-deep rounded-lg p-3">
                  <p className="text-[9px] font-mono text-muted-foreground tracking-widest">Paid</p>
                  <p className="font-mono text-status-green">${selected.paidAmount.toLocaleString()}</p>
                </div>
              </div>

              {/* Payment Timeline */}
              <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Payment Timeline</h3>
              <div className="space-y-0 mb-6">
                {getTimeline(selected).map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {/* Node */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        p.status === 'paid' ? 'bg-status-green/20 border border-status-green neon-glow-sm' :
                        p.status === 'missed' ? 'bg-status-red/20 border border-status-red' :
                        'bg-deep border border-border'
                      }`}>
                        {p.status === 'paid' && <Check className="w-2 h-2 text-status-green" />}
                        {p.status === 'missed' && <AlertCircle className="w-2 h-2 text-status-red" />}
                        {p.status === 'upcoming' && <Clock className="w-2 h-2 text-muted-foreground" />}
                      </div>
                      {i < getTimeline(selected).length - 1 && (
                        <div className={`w-px h-6 ${p.status === 'paid' ? 'bg-status-green/30' : 'bg-border'}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-4 -mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">${p.amount}</span>
                        <span className="font-mono text-[9px] text-muted-foreground">{p.date}</span>
                        {p.status !== 'upcoming' && (
                          <NeonBadge variant={p.status === 'paid' ? 'green' : 'red'}>{p.status}</NeonBadge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Options */}
              <NeonButton size="sm" className="w-full mb-4" loading={loadingOptions} onClick={handleGetOptions}>
                <Bot className="w-3 h-3" /> Modify Plan — Get AI Options
              </NeonButton>

              {aiOptions && (
                <div className="space-y-2">
                  <p className="text-[10px] font-mono text-neon tracking-widest uppercase mb-2">AI-Optimized Options</p>
                  {aiOptions.map((opt, i) => (
                    <div key={i} className="bg-deep border border-border rounded-lg p-3 hover:border-neon/30 transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display text-xs font-bold tracking-widest">{opt.label}</span>
                        <NeonBadge variant="neon">{opt.duration}mo</NeonBadge>
                      </div>
                      <p className="font-mono text-sm text-neon">${opt.amount}/mo</p>
                      <p className="text-[10px] text-muted-foreground">Est. recovery: ${Math.round(opt.totalRecovered).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
