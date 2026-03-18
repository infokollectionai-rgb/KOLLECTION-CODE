// @ts-nocheck
import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import { mockClients, mockMonthlyData } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminBilling() {
  const totalGross = mockClients.reduce((s, c) => s + c.monthlyRecovered, 0);
  const totalOps = mockClients.reduce((s, c) => s + c.monthlyRecovered * (c.operationsPct / 100), 0);
  const totalAfterOps = totalGross - totalOps;
  const totalKollection = mockClients.reduce((s, c) => {
    const net = c.monthlyRecovered - c.monthlyRecovered * (c.operationsPct / 100);
    return s + net * (c.recoveryPct / 100);
  }, 0);
  const totalPayouts = totalAfterOps - totalKollection;

  return (
    <PageWrapper title="Platform Revenue — July 2025">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Gross Collected" value={`$${totalGross.toLocaleString()}`} accent="green" />
        <KpiCard label="Total Ops Fees" value={`$${Math.round(totalOps).toLocaleString()}`} />
        <KpiCard label="Kollection Share" value={`$${Math.round(totalKollection).toLocaleString()}`} accent="neon" />
        <KpiCard label="Total Payouts to Clients" value={`$${Math.round(totalPayouts).toLocaleString()}`} />
      </div>

      {/* Revenue chart */}
      <div className="bg-card border border-border rounded-lg p-5 mb-8">
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

      {/* Per-client breakdown */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Client Breakdown</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Company', 'Setup Fee', 'Ops %', 'Recovery %', 'Collected', 'Ops Fee', 'Kollection', 'Client Payout'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => {
              const ops = c.monthlyRecovered * (c.operationsPct / 100);
              const net = c.monthlyRecovered - ops;
              const kShare = net * (c.recoveryPct / 100);
              const cShare = net - kShare;
              return (
                <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-foreground font-medium">{c.name}</td>
                  <td className="px-4 py-3 font-mono">${c.setupFee.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">{c.operationsPct}%</td>
                  <td className="px-4 py-3 font-mono">{c.recoveryPct}%</td>
                  <td className="px-4 py-3 font-mono">${c.monthlyRecovered.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">${Math.round(ops).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-primary">${Math.round(kShare).toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-status-green">${Math.round(cShare).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
