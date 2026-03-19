// @ts-nocheck
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
        <KpiCard label="Total Gross Recovered" value={`$${totalGross.toLocaleString()}`} accent="green" />
        <KpiCard label="Kollection Revenue (50%)" value={`$${totalKollection.toLocaleString()}`} accent="neon" />
        <KpiCard label="Fee Rate" value="50%" />
      </div>

      <div className="bg-panel border border-border rounded-lg p-5">
        <h3 className="text-xs text-muted-foreground mb-4">Revenue Breakdown — 6 Months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mockMonthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
            <Bar dataKey="gross" fill="#00aaff" radius={[3, 3, 0, 0]} name="Gross" />
            <Bar dataKey="client" fill="#22c98a" radius={[3, 3, 0, 0]} name="Client Payout" />
            <Bar dataKey="kollection" fill="#e05252" radius={[3, 3, 0, 0]} name="Kollection Fee" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </PageWrapper>
  );
}
