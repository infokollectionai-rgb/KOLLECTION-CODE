import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockPromises } from '@/data/mockData';
import { Target, Calendar } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';

const statusVariant = (s: string) => s === 'Paid' ? 'green' : s === 'Broken' ? 'red' : s === 'Due Today' ? 'yellow' : 'neon';

export default function PromiseTracker() {
  const paid = mockPromises.filter(p => p.status === 'Paid').length;
  const broken = mockPromises.filter(p => p.status === 'Broken').length;
  const upcoming = mockPromises.filter(p => p.status === 'Upcoming').length;
  const dueToday = mockPromises.filter(p => p.status === 'Due Today').length;

  return (
    <PageWrapper title="Promise-to-Pay Tracker">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Paid" value={paid} glowColor="green" />
        <KpiCard label="Broken" value={broken} glowColor="red" delay={80} />
        <KpiCard label="Upcoming" value={upcoming} delay={160} />
        <KpiCard label="Due Today" value={dueToday} glowColor="yellow" delay={240} />
      </div>

      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Debtor', 'Amount', 'Date', 'Status', 'Reschedules', 'Tier', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockPromises.map(p => (
              <tr key={p.id} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">{p.id}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{p.debtor}</td>
                <td className="px-4 py-3 font-mono text-neon">${p.amount.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{p.date}</td>
                <td className="px-4 py-3"><NeonBadge variant={statusVariant(p.status)}>{p.status}</NeonBadge></td>
                <td className="px-4 py-3 font-mono">{p.reschedules}</td>
                <td className="px-4 py-3"><NeonBadge variant={p.tier === 1 ? 'green' : 'yellow'}>T{p.tier}</NeonBadge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <NeonButton size="sm">Reschedule</NeonButton>
                    {p.status === 'Broken' && <NeonButton size="sm" className="border-status-red/50 text-status-red">Escalate</NeonButton>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
