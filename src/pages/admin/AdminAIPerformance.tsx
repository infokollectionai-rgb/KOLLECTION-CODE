import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

const responseTimeData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  avgMs: Math.floor(Math.random() * 800 + 200),
}));

const messageVolume = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  sms: Math.floor(Math.random() * 300 + 100),
  email: Math.floor(Math.random() * 150 + 50),
  voice: Math.floor(Math.random() * 80 + 20),
}));

export default function AdminAIPerformance() {
  return (
    <PageWrapper title="AI Performance">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Avg Response Time" value="1.2s" accent="green" />
        <KpiCard label="Success Rate" value="87%" accent="neon" />
        <KpiCard label="Messages Sent (24h)" value="2,847" />
        <KpiCard label="Active Calls" value="12" subtext="Live" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-panel border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Response Time — 24h</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={responseTimeData}>
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <Line type="monotone" dataKey="avgMs" stroke="#00aaff" strokeWidth={1.5} dot={false} name="Avg ms" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-panel border border-border rounded-lg p-5">
          <h3 className="text-xs text-muted-foreground mb-4">Message Volume — This Week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={messageVolume}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7a99' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0e1018', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, fontFamily: 'IBM Plex Mono' }} />
              <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
              <Bar dataKey="sms" fill="#00aaff" radius={[2, 2, 0, 0]} name="SMS" />
              <Bar dataKey="email" fill="#22c98a" radius={[2, 2, 0, 0]} name="Email" />
              <Bar dataKey="voice" fill="#e6a817" radius={[2, 2, 0, 0]} name="Voice" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageWrapper>
  );
}
