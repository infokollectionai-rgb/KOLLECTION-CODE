import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/apiClient';
import { Search, Phone, MessageSquare, Mail, Mic, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import ConversationPanel from '@/components/dashboard/ConversationPanel';

/* ── types ── */

interface Debtor {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  balance: number;
  days_overdue: number;
  tier: 1 | 2 | 3;
  status: string;
  last_contact_at: string | null;
  last_contact_channel: string | null;
  next_scheduled: string | null;
}

interface ListResponse {
  debtors: Debtor[];
  total: number;
  page: number;
  limit: number;
}

/* ── helpers ── */

const STATUS_OPTIONS = ['All', 'Active', 'In Negotiation', 'Promise Made', 'Paid', 'Ceased', 'Human Queue', 'Paused'] as const;
const TIER_OPTIONS = ['All', 'Tier 1', 'Tier 2', 'Tier 3'] as const;

function maskPhone(phone: string) {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 4) + '***' + phone.slice(-4);
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(iso: string | null) {
  if (!iso) return 'None';
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
}

const tierBadge: Record<number, string> = {
  1: 'text-status-green bg-status-green/10 border-status-green/20',
  2: 'text-status-yellow bg-status-yellow/10 border-status-yellow/20',
  3: 'text-status-red bg-status-red/10 border-status-red/20',
};

function statusColor(s: string) {
  const lower = s.toLowerCase();
  if (lower === 'paid') return 'text-status-green bg-status-green/10 border-status-green/20';
  if (lower === 'active') return 'text-primary bg-primary/10 border-primary/20';
  if (lower.includes('negoti')) return 'text-status-yellow bg-status-yellow/10 border-status-yellow/20';
  if (lower.includes('promise')) return 'text-status-yellow bg-status-yellow/10 border-status-yellow/20';
  if (lower === 'paused') return 'text-muted-foreground bg-muted border-border';
  if (lower.includes('human') || lower === 'escalated') return 'text-status-red bg-status-red/10 border-status-red/20';
  return 'text-muted-foreground bg-muted border-border';
}

function ChannelIcon({ channel }: { channel: string | null }) {
  if (!channel) return null;
  const c = channel.toLowerCase();
  if (c === 'sms') return <MessageSquare className="w-3 h-3 text-muted-foreground" />;
  if (c === 'email') return <Mail className="w-3 h-3 text-muted-foreground" />;
  if (c === 'voice') return <Mic className="w-3 h-3 text-muted-foreground" />;
  return <Phone className="w-3 h-3 text-muted-foreground" />;
}

/* ── confirm dialog ── */

function ConfirmDialog({ open, title, message, onConfirm, onCancel, loading }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <NeonButton variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</NeonButton>
          <NeonButton variant="solid" size="sm" onClick={onConfirm} loading={loading}>Confirm</NeonButton>
        </div>
      </div>
    </div>
  );
}

/* ── main component ── */

type SortKey = 'name' | 'balance' | 'days_overdue' | 'tier' | 'status' | 'last_contact_at';

export default function ActiveDebtorsTable() {
  const { profile } = useAuth();

  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [tierFilter, setTierFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('days_overdue');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewingDebtor, setViewingDebtor] = useState<Debtor | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; action: () => Promise<void> } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const limit = 25;
  const companyId = (profile as any)?.company_id ?? (profile as any)?.id ?? '';

  const fetchDebtors = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { companyId, limit: String(limit), page: String(page) };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      if (tierFilter !== 'All') params.tier = tierFilter.replace('Tier ', '');
      const data: ListResponse = await apiClient.get('/debtors/list', params);
      setDebtors(data.debtors ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setDebtors([]);
    } finally {
      setLoading(false);
    }
  }, [profile, companyId, search, statusFilter, tierFilter, page]);

  useEffect(() => { fetchDebtors(); }, [fetchDebtors]);
  useEffect(() => { setPage(1); }, [search, statusFilter, tierFilter]);

  /* ── sorting (client-side on current page) ── */
  const sorted = [...debtors].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'name': cmp = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`); break;
      case 'balance': cmp = a.balance - b.balance; break;
      case 'days_overdue': cmp = a.days_overdue - b.days_overdue; break;
      case 'tier': cmp = a.tier - b.tier; break;
      case 'status': cmp = a.status.localeCompare(b.status); break;
      case 'last_contact_at': cmp = (a.last_contact_at ?? '').localeCompare(b.last_contact_at ?? ''); break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />;
  };

  /* ── selection ── */
  const allSelected = sorted.length > 0 && sorted.every(d => selected.has(d.id));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(sorted.map(d => d.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  /* ── actions ── */
  const doAction = async (path: string) => {
    setActionLoading(true);
    try { await apiClient.post(path); } catch { /* ignore */ }
    setActionLoading(false);
    setConfirmDialog(null);
    setSelected(new Set());
    fetchDebtors();
  };

  const handlePauseResume = (d: Debtor) => {
    const isPaused = d.status.toLowerCase() === 'paused';
    doAction(`/debtors/${d.id}/${isPaused ? 'resume' : 'pause'}`);
  };

  const handleRemove = (d: Debtor) => {
    setConfirmDialog({
      title: 'Remove Debtor',
      message: `Remove ${d.first_name} ${d.last_name} from active collection? All scheduled contacts will be cancelled. This cannot be undone.`,
      action: () => doAction(`/debtors/${d.id}/remove`),
    });
  };

  const handleBulk = (action: 'pause' | 'remove') => {
    const ids = Array.from(selected);
    const label = action === 'pause' ? 'Pause' : 'Remove';
    setConfirmDialog({
      title: `${label} ${ids.length} debtor${ids.length > 1 ? 's' : ''}`,
      message: action === 'remove'
        ? `Remove ${ids.length} debtor(s) from active collection? All scheduled contacts will be cancelled. This cannot be undone.`
        : `Pause collection for ${ids.length} debtor(s)?`,
      action: async () => {
        setActionLoading(true);
        try { await apiClient.post('/debtors/bulk-action', { debtor_ids: ids, action }); } catch { /* */ }
        setActionLoading(false);
        setConfirmDialog(null);
        setSelected(new Set());
        fetchDebtors();
      },
    });
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectClass = 'bg-muted border border-border rounded-md px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary/30';

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="w-full bg-muted border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
          </select>
          <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className={selectClass}>
            {TIER_OPTIONS.map(t => <option key={t} value={t}>{t === 'All' ? 'All Tiers' : t}</option>)}
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/15">
            <span className="text-xs text-foreground font-medium">{selected.size} selected</span>
            <NeonButton size="sm" variant="outline" onClick={() => handleBulk('pause')}>Pause Selected</NeonButton>
            <NeonButton size="sm" variant="outline" onClick={() => handleBulk('remove')}>Remove Selected</NeonButton>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-2.5 w-8">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary" />
                </th>
                {([['Name', 'name'], ['Phone', null], ['Balance', 'balance'], ['Days OD', 'days_overdue'], ['Tier', 'tier'], ['Status', 'status'], ['Last Contact', 'last_contact_at'], ['Next', null], ['Actions', null]] as [string, SortKey | null][]).map(([label, key]) => (
                  <th
                    key={label}
                    className={`px-4 py-2.5 text-left text-[11px] text-muted-foreground font-medium whitespace-nowrap ${key ? 'cursor-pointer select-none hover:text-foreground' : ''}`}
                    onClick={() => key && toggleSort(key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {key && <SortIcon col={key} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-xs text-muted-foreground">Loading…</td></tr>
              ) : sorted.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-xs text-muted-foreground">No debtors found.</td></tr>
              ) : sorted.map(d => {
                const isPaid = d.status.toLowerCase() === 'paid';
                const isPaused = d.status.toLowerCase() === 'paused';
                return (
                  <tr key={d.id} className={`border-b border-border/50 transition-colors ${isPaid ? 'bg-status-green/5' : 'hover:bg-muted/30'}`}>
                    <td className="px-4 py-2.5">
                      <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggleOne(d.id)} className="accent-primary" />
                    </td>
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">{d.first_name} {d.last_name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{maskPhone(d.phone)}</td>
                    <td className="px-4 py-2.5 font-mono">${d.balance.toFixed(2)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{d.days_overdue}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${tierBadge[d.tier] ?? tierBadge[1]}`}>
                        Tier {d.tier}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 whitespace-nowrap ${statusColor(d.status)}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <ChannelIcon channel={d.last_contact_channel} />
                        {relativeTime(d.last_contact_at)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{formatDate(d.next_scheduled)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <NeonButton size="sm" variant="ghost" onClick={() => setViewingDebtor(d)}>View</NeonButton>
                        <NeonButton size="sm" variant="ghost" onClick={() => handlePauseResume(d)}>{isPaused ? 'Resume' : 'Pause'}</NeonButton>
                        <NeonButton size="sm" variant="ghost" onClick={() => handleRemove(d)} className="text-destructive hover:text-destructive">Remove</NeonButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-[11px] text-muted-foreground">{total} total · Page {page} of {totalPages}</span>
            <div className="flex items-center gap-1">
              <NeonButton size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-3.5 h-3.5" />
              </NeonButton>
              <NeonButton size="sm" variant="ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-3.5 h-3.5" />
              </NeonButton>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        message={confirmDialog?.message ?? ''}
        onConfirm={() => confirmDialog?.action()}
        onCancel={() => setConfirmDialog(null)}
        loading={actionLoading}
      />
    </>
  );
}
