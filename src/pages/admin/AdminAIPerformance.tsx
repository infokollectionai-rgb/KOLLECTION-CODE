import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  value: Math.random() * 2 + 0.5,
}));

const successRateData = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  rate: Math.random() * 20 + 75,
}));

export default function AdminAIPerformance() {
  return (
    <PageWrapper title="AI Performance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Avg Response Time" value={1.2} suffix="s" glowColor="green" />
        <KpiCard label="Success Rate" value={87} suffix="%" delay={100} />
        <KpiCard label="Messages Sent Today" value={2847} delay={200} />
        <KpiCard label="Active Calls Now" value={12} delay={300} subtext="● Live" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">Response Time — 24h</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={responseTimeData}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
              <Line type="monotone" dataKey="value" stroke="#00c8ff" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">AI Success Rate — 30 Days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={successRateData}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#2a4a5e' }} axisLine={false} tickLine={false} domain={[60, 100]} />
              <Tooltip contentStyle={{ background: '#090e18', border: '1px solid rgba(0,200,255,0.3)', borderRadius: 8, fontSize: 12, fontFamily: 'Share Tech Mono' }} />
              <Line type="monotone" dataKey="rate" stroke="#00ff88" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
