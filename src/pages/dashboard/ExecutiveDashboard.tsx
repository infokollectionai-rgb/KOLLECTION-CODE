import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import NeonBadge from '@/components/ui/NeonBadge';
import ChannelIcon from '@/components/ui/ChannelIcon';
import { mockDebtors, mockRecoveryChart, mockAiActivityFeed } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const tierData = [
  { name: 'Tier 1', value: mockDebtors.filter(d => d.tier === 1).length },
  { name: 'Tier 2', value: mockDebtors.filter(d => d.tier === 2).length },
  { name: 'Tier 3', value: mockDebtors.filter(d => d.tier === 3).length },
];

const COLORS = ['#00c8ff', '#0088bb', '#004466'];

const totalAssigned = mockDebtors.reduce((s, d) => s + d.amount, 0);
const totalRecovered = mockDebtors.reduce((s, d) => s + d.recovered, 0);
const recoveryRate = Math.round((totalRecovered / totalAssigned) * 100);
const activePlans = mockDebtors.filter(d => d.status === 'Active' || d.status === 'Negotiating').length;

export default function ExecutiveDashboard() {
  return (
    <PageWrapper title="Executive Dashboard">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <KpiCard label="Total Assigned" value={totalAssigned} prefix="$" delay={0} />
        <KpiCard label="Total Recovered" value={totalRecovered} prefix="$" delay={80} glowColor="green" />
        <KpiCard label="Recovery Rate" value={recoveryRate} suffix="%" delay={160} />
        <KpiCard label="Active Plans" value={activePlans} delay={240} />
        <KpiCard label="Floor Activations" value={3} delay={320} glowColor="yellow" subtext="30% of active" />
        <KpiCard label="Human Interventions" value={2} delay={400} glowColor="red" subtext="Escalated" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Recovery Line Chart */}
        <div className="lg:col-span-2 bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Recovery — 30 Day Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockRecoveryChart}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }}
                labelStyle={{ color: '#6a8fa8' }}
              />
              <Line type="monotone" dataKey="recovered" stroke="#00c8ff" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="target" stroke="#2a4a5e" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Distribution */}
        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={tierData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                {tierData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {tierData.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-[10px] font-mono text-muted-foreground">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Activity Feed */}
      <div className="bg-panel border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Live AI Activity Feed</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse-green" />
            <span className="text-[10px] font-mono text-status-green">LIVE</span>
          </div>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mockAiActivityFeed.map((item, i) => (
            <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="font-mono text-[11px] text-muted-foreground w-16 flex-shrink-0">{item.time}</span>
              <ChannelIcon channel={item.channel} className="w-3 h-3" />
              <span className="text-sm text-foreground flex-1">{item.action}</span>
              <NeonBadge variant={item.status === 'success' ? 'green' : item.status === 'warning' ? 'yellow' : item.status === 'error' ? 'red' : 'neon'}>
                {item.status}
              </NeonBadge>
            </div>
          ))}
        </div>
      </div>

      {/* AI Status Bar */}
      <div className="fixed bottom-0 left-[240px] right-0 h-10 bg-deep border-t border-border flex items-center px-8 gap-8 z-30">
        {[
          { label: 'AI Outreach Active', color: 'green' },
          { label: 'Voice Engine Online', color: 'green' },
          { label: 'Risk Model v2.1', color: 'green' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse-green" />
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{s.label}</span>
          </div>
        ))}
      </div>
    </PageWrapper>
  );
}
