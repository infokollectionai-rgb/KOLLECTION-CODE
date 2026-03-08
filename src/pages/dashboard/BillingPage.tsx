import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonButton from '@/components/ui/NeonButton';
import { mockMonthlyData } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';

export default function BillingPage() {
  const latestMonth = mockMonthlyData[mockMonthlyData.length - 1];

  return (
    <PageWrapper title="Billing">
      {/* Setup fee note */}
      <div className="bg-raised border border-border rounded-md px-4 py-2.5 mb-6 text-xs text-muted-foreground">
        Setup Fee Paid: <span className="font-mono text-foreground">Jan 15, 2025 — $299</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Recovered This Month" value={`$${latestMonth.gross.toLocaleString()}`} accent="green" />
        <KpiCard label="Kollection Fee (50%)" value={`$${latestMonth.kollection.toLocaleString()}`} />
        <KpiCard label="Your Payout (50%)" value={`$${latestMonth.client.toLocaleString()}`} accent="neon" />
        <KpiCard label="Fee Rate" value="50%" />
      </div>

      <div className="bg-panel border border-border rounded-lg p-5 mb-8">
        <h3 className="text-xs text-muted-foreground mb-4">Gross vs Payout vs Fee — 6 Months</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mockMonthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <Bar dataKey="gross" fill="#00aaff" radius={[3, 3, 0, 0]} name="Gross Recovered" />
            <Bar dataKey="client" fill="#22c98a" radius={[3, 3, 0, 0]} name="Your Payout" />
            <Bar dataKey="kollection" fill="#e05252" radius={[3, 3, 0, 0]} name="Kollection Fee" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Invoices</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Invoice', 'Period', 'Gross Recovered', 'Kollection Fee', 'Your Payout', 'Status', ''].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMonthlyData.map((m, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-raised/50 transition-colors">
                <td className="px-5 py-3 font-mono text-muted-foreground">INV-2025{String(i + 1).padStart(2, '0')}</td>
                <td className="px-5 py-3 text-foreground">{m.month} 2025</td>
                <td className="px-5 py-3 font-mono">${m.gross.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-muted-foreground">${m.kollection.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${m.client.toLocaleString()}</td>
                <td className="px-5 py-3"><span className="text-[10px] font-mono text-status-green">PAID</span></td>
                <td className="px-5 py-3"><NeonButton size="sm" variant="ghost"><Download className="w-3 h-3" /> PDF</NeonButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
