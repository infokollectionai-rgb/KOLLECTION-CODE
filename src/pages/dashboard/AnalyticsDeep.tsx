import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import { mockRecoveryChart, mockHeatmapData, mockDebtors } from '@/data/mockData';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AnalyticsDeep() {
  return (
    <PageWrapper title="Deep Analytics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Promise Kept Rate" value={67} suffix="%" glowColor="green" />
        <KpiCard label="Avg First Payment" value={14} suffix=" days" delay={80} />
        <KpiCard label="Plan Completion" value={42} suffix="%" delay={160} />
        <KpiCard label="Cost per $ Recovered" value={0} prefix="$0." suffix="18" delay={240} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Recovery Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mockRecoveryChart}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
              <Line type="monotone" dataKey="recovered" stroke="#00c8ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Outreach by Account</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mockDebtors.slice(0, 6).map(d => ({ name: d.name.split(' ')[0], attempts: d.attempts }))}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
              <Bar dataKey="attempts" fill="#00c8ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-panel border border-border rounded-xl p-6">
        <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Activity Heatmap — Day × Hour</h3>
        <div className="overflow-x-auto">
          <div className="inline-grid gap-[2px]" style={{ gridTemplateColumns: `40px repeat(24, 1fr)` }}>
            {/* Header */}
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-[8px] font-mono text-muted-foreground text-center w-6">{h}</div>
            ))}
            {/* Rows */}
            {days.map((day, di) => (
              <>
                <div key={`label-${di}`} className="text-[9px] font-mono text-muted-foreground flex items-center">{day}</div>
                {Array.from({ length: 24 }, (_, hi) => {
                  const val = mockHeatmapData.find(d => d.day === di && d.hour === hi)?.value || 0;
                  const opacity = Math.min(val / 100, 1);
                  return (
                    <div
                      key={`${di}-${hi}`}
                      className="w-6 h-5 rounded-sm"
                      style={{ background: `rgba(0,200,255,${opacity * 0.8})` }}
                      title={`${day} ${hi}:00 — ${Math.round(val)}`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
