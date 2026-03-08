import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonBadge from '@/components/ui/NeonBadge';
import { mockClients } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const platformRecovery = Array.from({ length: 12 }, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  value: Math.floor(Math.random() * 28000 + 12000),
}));

// Revenue = 50% of all recovered
const revenueByClient = mockClients.map(c => ({ name: c.name.split(' ')[0], revenue: Math.round(c.recovered * 0.5) }));

const tierDist = [
  { name: 'Tier 1', value: 340 },
  { name: 'Tier 2', value: 220 },
  { name: 'Tier 3', value: 73 },
];
const COLORS = ['#00c8ff', '#0088bb', '#004466'];

const totalDebt = mockClients.reduce((s, c) => s + c.totalDebt, 0);
const totalRecovered = mockClients.reduce((s, c) => s + c.recovered, 0);

export default function AdminOverview() {
  return (
    <PageWrapper title="Admin Overview">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KpiCard label="Total Clients" value={mockClients.length} delay={0} />
        <KpiCard label="Debt Under Mgmt" value={totalDebt} prefix="$" delay={100} />
        <KpiCard label="Platform Recovery" value={Math.round((totalRecovered / totalDebt) * 100)} suffix="%" delay={200} glowColor="green" />
        <KpiCard label="Revenue MTD (50%)" value={Math.round(totalRecovered * 0.5)} prefix="$" delay={300} glowColor="neon" subtext="50% of recovered" />
        <KpiCard label="Active AI Convos" value={847} delay={400} subtext="● Live" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Platform Recovery — 12 Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={platformRecovery}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
              <Line type="monotone" dataKey="value" stroke="#00c8ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tierDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {tierDist.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tierDist.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] font-mono text-muted-foreground">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Company', 'Industry', 'Accounts', 'Total Debt', 'Recovered', 'Kollection Rev (50%)', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => (
              <tr key={c.id} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">{c.id}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.industry}</td>
                <td className="px-4 py-3 font-mono">{c.accounts}</td>
                <td className="px-4 py-3 font-mono text-neon">${c.totalDebt.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-status-green">${c.recovered.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-neon">${Math.round(c.recovered * 0.5).toLocaleString()}</td>
                <td className="px-4 py-3"><NeonBadge variant={c.status === 'Active' ? 'green' : 'yellow'}>{c.status}</NeonBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* AI Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Uptime" value={99} suffix="%" glowColor="green" />
        <KpiCard label="Avg Response" value={1.2} suffix="s" delay={100} />
        <KpiCard label="Messages Today" value={2847} delay={200} />
        <KpiCard label="Calls Active" value={12} delay={300} subtext="● Live" />
      </div>
    </PageWrapper>
  );
}
