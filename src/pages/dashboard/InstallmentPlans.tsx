import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockInstallments } from '@/data/mockData';
import { X, Check, Clock, AlertCircle } from 'lucide-react';

export default function InstallmentPlans() {
  const [selected, setSelected] = useState<typeof mockInstallments[0] | null>(null);

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
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Debtor', 'Total', 'Paid', 'Plan Amt', 'Progress', 'Status', 'Next Due'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockInstallments.map(inst => {
              const pct = Math.round((inst.paymentsMade / inst.paymentsTotal) * 100);
              return (
                <tr key={inst.id} onClick={() => setSelected(inst)} className="border-b border-border/50 hover:bg-raised/50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 font-mono text-muted-foreground text-xs">{inst.id}</td>
                  <td className="px-5 py-3 text-foreground">{inst.debtor}</td>
                  <td className="px-5 py-3 font-mono">${inst.totalAmount.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono text-status-green">${inst.paidAmount.toLocaleString()}</td>
                  <td className="px-5 py-3 font-mono">${inst.planAmount}/mo</td>
                  <td className="px-5 py-3 font-mono text-xs">{inst.paymentsMade}/{inst.paymentsTotal} ({pct}%)</td>
                  <td className="px-5 py-3"><StatusBadge variant={inst.status === 'Active' ? 'green' : 'red'}>{inst.status}</StatusBadge></td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inst.nextDue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-panel border-l border-border animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold">{selected.debtor}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-raised rounded-md p-3">
                  <p className="text-[10px] text-muted-foreground">Total</p>
                  <p className="font-mono text-sm">${selected.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-raised rounded-md p-3">
                  <p className="text-[10px] text-muted-foreground">Paid</p>
                  <p className="font-mono text-sm text-status-green">${selected.paidAmount.toLocaleString()}</p>
                </div>
              </div>

              <h3 className="text-xs text-muted-foreground mb-3">Payment Timeline</h3>
              <div className="space-y-0 mb-6">
                {getTimeline(selected).map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 border ${
                        p.status === 'paid' ? 'bg-status-green/15 border-status-green' :
                        p.status === 'missed' ? 'bg-status-red/15 border-status-red' :
                        'bg-raised border-border'
                      }`}>
                        {p.status === 'paid' && <Check className="w-2 h-2 text-status-green" />}
                        {p.status === 'missed' && <AlertCircle className="w-2 h-2 text-status-red" />}
                        {p.status === 'upcoming' && <Clock className="w-2 h-2 text-muted-foreground" />}
                      </div>
                      {i < getTimeline(selected).length - 1 && (
                        <div className={`w-px h-5 ${p.status === 'paid' ? 'bg-status-green/20' : 'bg-border'}`} />
                      )}
                    </div>
                    <div className="pb-3 -mt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-foreground">${p.amount}</span>
                        <span className="text-[10px] text-muted-foreground">{p.date}</span>
                        {p.status !== 'upcoming' && (
                          <StatusBadge variant={p.status === 'paid' ? 'green' : 'red'}>{p.status}</StatusBadge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
