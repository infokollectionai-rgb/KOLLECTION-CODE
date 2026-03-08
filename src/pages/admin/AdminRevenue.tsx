import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import { mockMonthlyData } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminRevenue() {
  const totalGross = mockMonthlyData.reduce((s, m) => s + m.gross, 0);
  const totalKollection = mockMonthlyData.reduce((s, m) => s + m.kollection, 0);

  return (
    <PageWrapper title="Platform Revenue">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard label="Total Gross Recovered" value={totalGross} prefix="$" glowColor="green" />
        <KpiCard label="Kollection Revenue (50%)" value={totalKollection} prefix="$" delay={100} glowColor="neon" />
        <KpiCard label="Fee Rate" value={50} suffix="%" delay={200} />
      </div>

      <div className="bg-panel border border-border rounded-xl p-6">
        <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Revenue Breakdown — 6 Months</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockMonthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Share Tech Mono' }} />
            <Bar dataKey="gross" fill="#00c8ff" radius={[4, 4, 0, 0]} name="Gross Recovered" />
            <Bar dataKey="client" fill="#00ff88" radius={[4, 4, 0, 0]} name="Client Payout (50%)" />
            <Bar dataKey="kollection" fill="#ff3366" radius={[4, 4, 0, 0]} name="Kollection Fee (50%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageWrapper>
  );
}
