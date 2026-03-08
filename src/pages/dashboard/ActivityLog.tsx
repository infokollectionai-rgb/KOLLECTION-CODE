import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import { mockActivityLog } from '@/data/mockData';
import { Search } from 'lucide-react';

const typeBadge = (t: string) => {
  if (t.includes('Payment')) return 'green' as const;
  if (t.includes('Escalat') || t.includes('Broken')) return 'red' as const;
  if (t.includes('Promise Logged')) return 'yellow' as const;
  return 'blue' as const;
};

export default function ActivityLog() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const types = [...new Set(mockActivityLog.map(a => a.type))];
  const filtered = mockActivityLog.filter(a => {
    if (search && !a.debtor.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <PageWrapper title="Activity Log">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by debtor..."
            className="w-full bg-panel border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-neon/30 outline-none transition-colors"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-panel border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none"
        >
          <option value="">All Types</option>
          {types.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Timestamp', 'Debtor', 'Action Type', 'Channel', 'Outcome', 'AI Stage'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No activity found</p>
              </td></tr>
            ) : filtered.map(a => (
              <tr key={a.id} className="border-b border-border/50 hover:bg-raised/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{a.timestamp}</td>
                <td className="px-5 py-3 text-foreground">{a.debtor}</td>
                <td className="px-5 py-3"><StatusBadge variant={typeBadge(a.type)}>{a.type}</StatusBadge></td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{a.channel}</td>
                <td className="px-5 py-3 text-xs text-foreground">{a.outcome}</td>
                <td className="px-5 py-3 font-mono text-[10px] text-muted-foreground">{a.aiStage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
