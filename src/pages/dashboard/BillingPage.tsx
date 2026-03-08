import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockBillingData, mockOperationsCosts } from '@/data/mockData';
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function BillingPage() {
  const { setupFeePaid, currentMonth, history } = mockBillingData;
  const [showOpsDetail, setShowOpsDetail] = useState(false);

  return (
    <PageWrapper title="Billing">
      {/* Setup fee note */}
      <div className="bg-muted border border-border rounded-md px-4 py-2.5 mb-6 text-xs text-muted-foreground">
        Setup Fee Paid: <span className="font-mono text-foreground">${setupFeePaid.amount.toLocaleString()} — {setupFeePaid.date}</span> ✓
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Gross Recovered" value={`$${currentMonth.recovered.toLocaleString()}`} accent="green" />
        <KpiCard label={`Ops Fee (${currentMonth.opsFeePct}%)`} value={`$${currentMonth.opsFee.toLocaleString()}`} subtext="Deducted first" />
        <KpiCard label="Your Payout (50%)" value={`$${currentMonth.client.toLocaleString()}`} accent="neon" subtext={`Due: ${currentMonth.payoutDate}`} />
      </div>

      {/* Operations breakdown toggle */}
      <div className="bg-card border border-border rounded-lg mb-8 overflow-hidden">
        <button
          onClick={() => setShowOpsDetail(!showOpsDetail)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-6 text-xs">
            <span className="text-muted-foreground">OPERATIONS COST OVERVIEW — Jul 2025</span>
            <span className="font-mono text-foreground">Gross: ${currentMonth.recovered.toLocaleString()}</span>
            <span className="font-mono text-muted-foreground">Ops: ${currentMonth.opsFee.toLocaleString()}</span>
            <span className="font-mono text-foreground">After Ops: ${currentMonth.afterOps.toLocaleString()}</span>
            <span className="font-mono text-status-green">Your Payout: ${currentMonth.client.toLocaleString()}</span>
          </div>
          {showOpsDetail ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showOpsDetail && (
          <div className="border-t border-border p-5">
            <div className="mb-5">
              <h4 className="text-xs font-medium text-foreground mb-3">How Your Billing Works</h4>
              <div className="space-y-1.5 text-xs max-w-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Gross Recovered</span><span className="font-mono text-foreground">${mockOperationsCosts.grossRecovered.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Operations Coverage ({mockOperationsCosts.opsFeePct}%)</span><span className="font-mono text-destructive">-${mockOperationsCosts.opsFeeCharged.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5"><span className="text-muted-foreground">Net After Operations</span><span className="font-mono text-foreground">${mockOperationsCosts.afterOps.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kollection Share (50%)</span><span className="font-mono text-foreground">-${mockOperationsCosts.kollectionShare.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-border pt-1.5"><span className="text-foreground font-medium">YOUR PAYOUT (50%)</span><span className="font-mono text-status-green">${mockOperationsCosts.clientShare.toFixed(2)}</span></div>
              </div>
            </div>

            <h4 className="text-xs font-medium text-foreground mb-3">Operations Detail — What the {mockOperationsCosts.opsFeePct}% covers</h4>
            <table className="w-full text-xs max-w-lg">
              <thead>
                <tr className="border-b border-border">
                  {['Activity', 'Count', 'Unit Cost', 'Total'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockOperationsCosts.breakdown.map((b, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-3 py-2 text-foreground">{b.type}</td>
                    <td className="px-3 py-2 font-mono">{b.count.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">${b.unitCost}</td>
                    <td className="px-3 py-2 font-mono">${b.total.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-foreground font-medium" colSpan={3}>Actual Cost</td>
                  <td className="px-3 py-2 font-mono">${mockOperationsCosts.actualCost.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-foreground font-medium" colSpan={3}>Ops Fee Charged</td>
                  <td className="px-3 py-2 font-mono">${mockOperationsCosts.opsFeeCharged.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground" colSpan={3}>Surplus (covers infra overhead)</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">${mockOperationsCosts.surplus.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] text-muted-foreground mt-3 max-w-lg leading-relaxed">
              The operations fee covers your dedicated Twilio number, VAPI voice calls, and email delivery. Any surplus goes toward infrastructure maintenance and support.
            </p>
          </div>
        )}
      </div>

      {/* Payout history */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Payout History</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Month', 'Gross', 'Ops Fee', 'Your 50%', 'Status', 'Receipt'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-foreground">{row.month}</td>
                <td className="px-5 py-3 font-mono">${row.recovered.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">${row.opsFee.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${row.client.toLocaleString()}</td>
                <td className="px-5 py-3">
                  <StatusBadge variant={row.status === 'Paid' ? 'green' : 'yellow'}>{row.status}</StatusBadge>
                </td>
                <td className="px-5 py-3">
                  {row.transferId ? (
                    <NeonButton size="sm" variant="ghost"><ExternalLink className="w-3 h-3" /> PDF</NeonButton>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div className="mt-6 space-y-1 text-[10px] text-muted-foreground">
        <p>Payout Schedule: 1st of every month, automatic via Stripe</p>
        <p>Your Stripe account: acct_xxxx ✓ Connected</p>
        <p>Recovery fee: 50% of net after ops deduction</p>
        <p>Operations fee: {currentMonth.opsFeePct}% of gross (covers SMS, calls, emails)</p>
      </div>
    </PageWrapper>
  );
}
