import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonButton from '@/components/ui/NeonButton';
import { mockMonthlyData } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';

export default function BillingPage() {
  const latestMonth = mockMonthlyData[mockMonthlyData.length - 1];

  return (
    <PageWrapper title="Billing & Revenue">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Recovered This Month" value={latestMonth.gross} prefix="$" glowColor="green" />
        <KpiCard label="Kollection Fee (50%)" value={latestMonth.kollection} prefix="$" delay={100} glowColor="neon" />
        <KpiCard label="Your Payout (50%)" value={latestMonth.client} prefix="$" delay={200} />
        <KpiCard label="Fee Rate" value={50} suffix="%" delay={300} />
      </div>

      {/* Fee Example Card */}
      <div className="bg-panel border border-neon/20 rounded-xl p-6 mb-8 shadow-[0_0_12px_rgba(0,200,255,0.1)]">
        <h3 className="font-mono text-[10px] tracking-widest text-neon mb-4 uppercase">Recovery Fee Breakdown</h3>
        <div className="grid grid-cols-3 gap-6 text-center">
          {[
            { recovered: 500, label: 'Small Loan' },
            { recovered: 800, label: 'Mid Loan' },
            { recovered: 1200, label: 'Large Loan' },
          ].map(ex => (
            <div key={ex.label} className="bg-deep border border-border rounded-lg p-4">
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase mb-2">{ex.label}</p>
              <p className="font-mono text-lg text-foreground mb-1">Recovered: <span className="text-neon">${ex.recovered}</span></p>
              <div className="flex justify-between text-xs font-mono mt-2">
                <span className="text-neon">You: ${ex.recovered / 2}</span>
                <span className="text-muted-foreground">Kollection: ${ex.recovered / 2}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-panel border border-border rounded-xl p-6 mb-8">
        <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Gross vs Your Payout vs Kollection Fee — 6 Months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mockMonthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Share Tech Mono' }} />
            <Bar dataKey="gross" fill="#00c8ff" radius={[4, 4, 0, 0]} name="Gross Recovered" />
            <Bar dataKey="client" fill="#00ff88" radius={[4, 4, 0, 0]} name="Your Payout (50%)" />
            <Bar dataKey="kollection" fill="#ff3366" radius={[4, 4, 0, 0]} name="Kollection Fee (50%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Invoice', 'Period', 'Gross', 'Kollection Fee', 'Your Payout', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMonthlyData.map((m, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">INV-{2025}{String(i + 1).padStart(2, '0')}</td>
                <td className="px-4 py-3 text-foreground">{m.month} 2025</td>
                <td className="px-4 py-3 font-mono text-neon">${m.gross.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-status-red">${m.kollection.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-status-green">${m.client.toLocaleString()}</td>
                <td className="px-4 py-3"><span className="text-[10px] font-mono text-status-green">PAID</span></td>
                <td className="px-4 py-3"><NeonButton size="sm"><Download className="w-3 h-3" /> PDF</NeonButton></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
