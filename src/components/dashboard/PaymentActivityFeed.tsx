import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { DollarSign, Link2, TrendingUp, CreditCard } from 'lucide-react';

interface PaymentEvent {
  id: string;
  type: 'PAID' | 'LINK_OPENED' | 'EXPIRED';
  debtor_first_name: string;
  debtor_last_name: string;
  amount?: number;
  currency?: string;
  channel?: 'SMS' | 'Email' | 'Voice';
  created_at: string;
}

interface PaymentStats {
  collected_this_month: number;
  total_collected: number;
  active_links: number;
  conversion_rate: number;
}

interface ActivityResponse {
  stats: PaymentStats;
  events: PaymentEvent[];
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatName(first: string, last: string) {
  return `${first} ${last?.charAt(0) || ''}.`;
}

const dotColor = { PAID: 'bg-status-green', LINK_OPENED: 'bg-status-yellow', EXPIRED: 'bg-muted-foreground/40' } as const;
const badgeStyle = {
  PAID: 'text-status-green bg-status-green/10 border-status-green/20',
  LINK_OPENED: 'text-status-yellow bg-status-yellow/10 border-status-yellow/20',
  EXPIRED: 'text-muted-foreground bg-muted border-border',
} as const;
const badgeLabel = { PAID: 'PAID', LINK_OPENED: 'IN PROGRESS', EXPIRED: 'EXPIRED' } as const;

export default function PaymentActivityFeed() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [events, setEvents] = useState<PaymentEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profile) return;
    try {
      const data: ActivityResponse = await apiClient.get('/payments/activity', {
        companyId: (profile as any).company_id ?? (profile as any).id ?? '',
        limit: '50',
      });
      setStats(data.stats);
      setEvents(data.events ?? []);
    } catch {
      // silently fail — empty state will show
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const statCards = [
    { label: 'Collected This Month', value: stats ? `$${stats.collected_this_month.toLocaleString()}` : '—', icon: DollarSign, accent: 'text-status-green' },
    { label: 'Total Collected', value: stats ? `$${stats.total_collected.toLocaleString()}` : '—', icon: CreditCard, accent: 'text-foreground' },
    { label: 'Active Payment Links', value: stats ? stats.active_links.toString() : '—', icon: Link2, accent: 'text-foreground' },
    { label: 'Conversion Rate', value: stats ? `${stats.conversion_rate}%` : '—', icon: TrendingUp, accent: 'text-foreground' },
  ];

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground tracking-wide">{c.label}</span>
            </div>
            <p className={`font-mono text-lg font-semibold ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Event feed */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <h3 className="text-xs text-muted-foreground">Payment Activity</h3>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">Loading…</div>
        ) : events.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No payment activity yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Import debtors to get started.</p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/50">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                {/* dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor[ev.type]}`} />

                {/* name + detail */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground font-medium">
                    {formatName(ev.debtor_first_name, ev.debtor_last_name)}
                  </span>
                  {ev.type === 'PAID' && ev.amount != null && (
                    <span className="ml-2 font-mono text-sm text-status-green">${ev.amount.toFixed(2)} {ev.currency ?? 'CAD'}</span>
                  )}
                  {ev.type === 'LINK_OPENED' && (
                    <span className="ml-2 text-xs text-muted-foreground">Payment link opened</span>
                  )}
                  {ev.type === 'EXPIRED' && (
                    <span className="ml-2 text-xs text-muted-foreground">Payment link expired</span>
                  )}
                </div>

                {/* channel badge */}
                {ev.channel && (
                  <span className="text-[10px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                    {ev.channel}
                  </span>
                )}

                {/* time */}
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{relativeTime(ev.created_at)}</span>

                {/* status badge */}
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap ${badgeStyle[ev.type]}`}>
                  {badgeLabel[ev.type]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
