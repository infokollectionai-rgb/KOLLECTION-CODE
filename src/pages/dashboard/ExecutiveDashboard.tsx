import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockDebtors, mockRecoveryChart } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Download } from 'lucide-react';

const totalAssigned = mockDebtors.reduce((s, d) => s + d.balance, 0);
const totalRecovered = mockDebtors.reduce((s, d) => s + d.recovered, 0);
const recoveryRate = Math.round((totalRecovered / totalAssigned) * 100);
const clientPayout = Math.round(totalRecovered * 0.5);

const statusData = [
  { name: 'Active', value: mockDebtors.filter(d => d.status === 'Active' || d.status === 'Negotiating').length },
  { name: 'Paid', value: mockDebtors.filter(d => d.status === 'Paid').length },
  { name: 'Escalated', value: mockDebtors.filter(d => d.status === 'Escalated' || d.status === 'Manual').length },
];
const COLORS = ['#00aaff', '#22c98a', '#e05252'];

const statusBadge = (s: string) => s === 'Paid' ? 'green' as const : s === 'Escalated' || s === 'Manual' ? 'red' as const : s === 'Negotiating' ? 'yellow' as const : 'blue' as const;

export default function ExecutiveDashboard() {
  return (
    <PageWrapper title="Dashboard">
      {/* Import CTA Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Start Recovering Instantly</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Import your overdue accounts and our AI starts calling and texting them within minutes. Just drop your Excel file.
              </p>
              <p className="text-[10px] text-muted-foreground mt-1.5">Accepted: .xlsx  .xls  .csv — <button className="text-primary hover:underline">Download template ↓</button></p>
            </div>
          </div>
          <Link to="/dashboard/import" className="flex-shrink-0">
            <NeonButton variant="solid" size="sm">Import Accounts <ArrowRight className="w-3 h-3" /></NeonButton>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Accounts in System" value={mockDebtors.length.toString()} />
        <KpiCard label="Total Recovered" value={`$${totalRecovered.toLocaleString()}`} accent="green" />
        <KpiCard label="Recovery Rate" value={`${recoveryRate}%`} accent="neon" />
        <KpiCard label="Your Next Payout" value={`$${clientPayout.toLocaleString()}`} subtext="Sep 1, 2025" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Recovery — Last 30 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mockRecoveryChart}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="recovered" stroke="#00aaff" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Account Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[11px] text-muted-foreground">{t.name} ({t.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent accounts */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Recent Account Activity</h3>
          <Link to="/dashboard/accounts" className="text-xs text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Balance', 'Recovered', 'Status', 'Last AI Action'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockDebtors.slice(0, 5).map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-foreground">{d.name}</td>
                <td className="px-5 py-3 font-mono text-sm">${d.balance.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-sm text-status-green">${d.recovered.toLocaleString()}</td>
                <td className="px-5 py-3"><StatusBadge variant={statusBadge(d.status)}>{d.status}</StatusBadge></td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{d.lastAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
