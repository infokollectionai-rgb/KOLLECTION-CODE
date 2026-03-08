import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockPromises } from '@/data/mockData';
import { Target, Calendar, List } from 'lucide-react';
import KpiCard from '@/components/ui/KpiCard';

const statusVariant = (s: string) => s === 'Paid' ? 'green' as const : s === 'Broken' ? 'red' as const : s === 'Due Today' ? 'yellow' as const : 'neon' as const;

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

export default function PromiseTracker() {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const paid = mockPromises.filter(p => p.status === 'Paid').length;
  const broken = mockPromises.filter(p => p.status === 'Broken').length;
  const upcoming = mockPromises.filter(p => p.status === 'Upcoming').length;
  const dueToday = mockPromises.filter(p => p.status === 'Due Today').length;

  // Generate calendar heatmap data
  const calendarData = Array.from({ length: 31 }, (_, day) => {
    const promise = mockPromises.find(p => {
      const d = new Date(p.date).getDate();
      return d === day + 1;
    });
    return {
      day: day + 1,
      status: promise?.status || null,
      debtor: promise?.debtor || null,
      amount: promise?.amount || 0,
    };
  });

  return (
    <PageWrapper title="Promise-to-Pay Tracker">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Paid" value={paid} glowColor="green" />
        <KpiCard label="Broken" value={broken} glowColor="red" delay={80} />
        <KpiCard label="Upcoming" value={upcoming} delay={160} />
        <KpiCard label="Due Today" value={dueToday} glowColor="yellow" delay={240} />
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setView('table')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all border ${
            view === 'table' ? 'bg-neon/20 text-neon border-neon/40 neon-glow-sm' : 'border-border text-muted-foreground'
          }`}
        >
          <List className="w-3 h-3" /> Table
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all border ${
            view === 'calendar' ? 'bg-neon/20 text-neon border-neon/40 neon-glow-sm' : 'border-border text-muted-foreground'
          }`}
        >
          <Calendar className="w-3 h-3" /> Calendar
        </button>
      </div>

      {view === 'table' ? (
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
      ) : (
        <div className="bg-panel border border-border rounded-xl p-6">
          <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4 uppercase">August 2025 — Promise Calendar</h3>
          <div className="grid grid-cols-7 gap-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
              <div key={d} className="text-[9px] font-mono text-muted-foreground text-center tracking-widest py-1">{d}</div>
            ))}
            {/* Offset for August 2025 starting on Friday */}
            {Array.from({ length: 5 }, (_, i) => <div key={`empty-${i}`} />)}
            {calendarData.map((cell, i) => {
              const bg = cell.status === 'Paid' ? 'bg-status-green/20 border-status-green/30' :
                         cell.status === 'Broken' ? 'bg-status-red/20 border-status-red/30' :
                         cell.status === 'Due Today' ? 'bg-status-yellow/20 border-status-yellow/30' :
                         cell.status === 'Upcoming' ? 'bg-neon/10 border-neon/20' :
                         'bg-deep border-border/30';
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border p-2 flex flex-col items-center justify-center transition-all ${bg} ${cell.status ? 'cursor-pointer hover:border-neon/50' : ''}`}
                  title={cell.debtor ? `${cell.debtor}: $${cell.amount} — ${cell.status}` : undefined}
                >
                  <span className="font-mono text-[11px] text-foreground">{cell.day}</span>
                  {cell.status && (
                    <span className="font-mono text-[7px] text-neon mt-0.5">${cell.amount}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
