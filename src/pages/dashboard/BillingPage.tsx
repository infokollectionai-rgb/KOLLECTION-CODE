import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonButton from '@/components/ui/NeonButton';
import { mockMonthlyData } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';

export default function BillingPage() {
  return (
    <PageWrapper title="Billing & Revenue">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <KpiCard label="Gross Recovery MTD" value={58000} prefix="$" glowColor="green" />
        <KpiCard label="Net to Client" value={46400} prefix="$" delay={100} />
        <KpiCard label="Kollection Fee" value={11600} prefix="$" delay={200} glowColor="neon" />
      </div>

      <div className="bg-panel border border-border rounded-xl p-6 mb-8">
        <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Gross vs Net vs Fee — 6 Months</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={mockMonthlyData}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'Share Tech Mono' }} />
            <Bar dataKey="gross" fill="#00c8ff" radius={[4, 4, 0, 0]} name="Gross" />
            <Bar dataKey="net" fill="#00ff88" radius={[4, 4, 0, 0]} name="Net" />
            <Bar dataKey="fee" fill="#ff3366" radius={[4, 4, 0, 0]} name="Fee" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Invoice', 'Period', 'Amount', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockMonthlyData.map((m, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">INV-{2025}{String(i + 1).padStart(2, '0')}</td>
                <td className="px-4 py-3 text-foreground">{m.month} 2025</td>
                <td className="px-4 py-3 font-mono text-neon">${m.fee.toLocaleString()}</td>
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
