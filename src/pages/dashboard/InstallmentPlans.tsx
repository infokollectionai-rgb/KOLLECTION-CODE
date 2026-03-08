import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockInstallments } from '@/data/mockData';

export default function InstallmentPlans() {
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
                <tr key={inst.id} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
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
    </PageWrapper>
  );
}
