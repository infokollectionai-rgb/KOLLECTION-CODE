import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockBillingData } from '@/data/mockData';
import { Download, ExternalLink } from 'lucide-react';

export default function BillingPage() {
  const { setupFeePaid, currentMonth, history } = mockBillingData;

  return (
    <PageWrapper title="Billing">
      {/* Setup fee note */}
      <div className="bg-muted border border-border rounded-md px-4 py-2.5 mb-6 text-xs text-muted-foreground">
        Setup Fee Paid: <span className="font-mono text-foreground">{setupFeePaid.date} — ${setupFeePaid.amount}</span>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Current Month Recovered" value={`$${currentMonth.recovered.toLocaleString()}`} accent="green" />
        <KpiCard label="Kollection Fee (50%)" value={`$${currentMonth.kollection.toLocaleString()}`} />
        <KpiCard label="Your Payout (50%)" value={`$${currentMonth.client.toLocaleString()}`} accent="neon" subtext={`Due: ${currentMonth.payoutDate}`} />
      </div>

      {/* How payouts work */}
      <div className="bg-primary/5 border border-primary/15 rounded-lg p-4 mb-8">
        <p className="text-xs font-medium text-foreground mb-1">How Your Payouts Work</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Payments collected from your debtors are split 50/50 automatically via Stripe.
          Your 50% is transferred to your connected Stripe account on the 1st of every month.
        </p>
      </div>

      {/* Payout history */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs text-muted-foreground">Payout History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Month', 'Recovered', 'Kollection (50%)', 'Your Payout (50%)', 'Status', 'Transfer'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-foreground">{row.month}</td>
                <td className="px-5 py-3 font-mono">${row.recovered.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">${row.kollection.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${row.client.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <StatusBadge variant={row.status === 'Paid' ? 'green' : 'yellow'}>{row.status}</StatusBadge>
                </td>
                <td className="px-5 py-3">
                  {row.transferId ? (
                    <NeonButton size="sm" variant="ghost"><ExternalLink className="w-3 h-3" /> View</NeonButton>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
