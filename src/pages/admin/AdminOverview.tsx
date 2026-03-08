import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import { mockClients } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const platformRecovery = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  value: Math.floor(Math.random() * 28000 + 12000),
}));

const tierDist = [
  { name: 'Tier 1', value: 340 },
  { name: 'Tier 2', value: 220 },
  { name: 'Tier 3', value: 73 },
];
const COLORS = ['#00aaff', '#22c98a', '#e6a817'];

const totalDebt = mockClients.reduce((s, c) => s + c.totalDebt, 0);
const totalRecovered = mockClients.reduce((s, c) => s + c.recovered, 0);

export default function AdminOverview() {
  return (
    <PageWrapper title="Admin Overview">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Clients" value={mockClients.length.toString()} />
        <KpiCard label="Debt Under Mgmt" value={`$${totalDebt.toLocaleString()}`} />
        <KpiCard label="Platform Recovery" value={`${Math.round((totalRecovered / totalDebt) * 100)}%`} accent="green" />
        <KpiCard label="Revenue MTD (50%)" value={`$${Math.round(totalRecovered * 0.5).toLocaleString()}`} accent="neon" />
        <KpiCard label="Active AI Convos" value="847" subtext="Live" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-panel border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Platform Recovery — 12 Month</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={platformRecovery}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="value" stroke="#00aaff" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-panel border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={tierDist} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" stroke="none">
                {tierDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-lg overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Company', 'Industry', 'Accounts', 'Total Debt', 'Recovered', 'Kollection Rev (50%)', 'Status'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-raised/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="px-5 py-3 text-foreground font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.industry}</td>
                <td className="px-5 py-3 font-mono">{c.accounts}</td>
                <td className="px-5 py-3 font-mono">${c.totalDebt.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${c.recovered.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono">${Math.round(c.recovered * 0.5).toLocaleString()}</td>
                <td className="px-5 py-3"><StatusBadge variant={c.status === 'Active' ? 'green' : 'yellow'}>{c.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Uptime" value="99.9%" accent="green" />
        <KpiCard label="Avg Response" value="1.2s" />
        <KpiCard label="Messages Today" value="2,847" />
        <KpiCard label="Calls Active" value="12" subtext="Live" />
      </div>
    </PageWrapper>
  );
}
