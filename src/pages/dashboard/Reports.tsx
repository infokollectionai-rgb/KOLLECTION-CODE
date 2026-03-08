import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonButton from '@/components/ui/NeonButton';
import { mockDebtors, mockMonthlyData } from '@/data/mockData';
import { Download } from 'lucide-react';

const totalAssigned = mockDebtors.reduce((s, d) => s + d.balance, 0);
const totalRecovered = mockDebtors.reduce((s, d) => s + d.recovered, 0);
const resolved = mockDebtors.filter(d => d.status === 'Paid').length;

export default function Reports() {
  return (
    <PageWrapper title="Reports">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">Monthly recovery statements and downloadable reports.</p>
        <NeonButton size="sm"><Download className="w-3 h-3" /> Download Current Report</NeonButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Accounts Submitted" value={mockDebtors.length.toString()} />
        <KpiCard label="Accounts Resolved" value={resolved.toString()} accent="green" />
        <KpiCard label="Total Recovered" value={`$${totalRecovered.toLocaleString()}`} accent="green" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Kollection Fee (50%)" value={`$${Math.round(totalRecovered * 0.5).toLocaleString()}`} />
        <KpiCard label="Your Payout (50%)" value={`$${Math.round(totalRecovered * 0.5).toLocaleString()}`} accent="neon" />
        <KpiCard label="Pending Recovery" value={`$${(totalAssigned - totalRecovered).toLocaleString()}`} accent="yellow" />
      </div>

      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Monthly Statements</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Month', 'Accounts', 'Gross Recovered', 'Kollection Fee', 'Your Payout', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMonthlyData.map((m, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-raised/50 transition-colors">
                <td className="px-5 py-3 text-foreground">{m.month} 2025</td>
                <td className="px-5 py-3 font-mono">{Math.floor(Math.random() * 20 + 5)}</td>
                <td className="px-5 py-3 font-mono">${m.gross.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">${m.kollection.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${m.client.toLocaleString()}</td>
                <td className="px-5 py-3"><span className="text-[10px] font-mono text-status-green">PAID</span></td>
                <td className="px-5 py-3">
                  <NeonButton size="sm" variant="ghost"><Download className="w-3 h-3" /> PDF</NeonButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
