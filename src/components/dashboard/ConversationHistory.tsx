import { useState, useEffect } from 'react';
import { X, MessageSquare, Mail, Headset, ArrowRight, ArrowLeft, ExternalLink, Loader2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import NeonButton from '@/components/ui/NeonButton';

/* ── types ── */

interface DebtorProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: string;
  tier: number;
  negotiation_layer: number;
  balance: number;
  floor: number;
}

interface PaymentLink {
  url: string;
  status: 'ACTIVE' | 'PAID' | 'EXPIRED';
}

interface PromiseRecord {
  amount: number;
  due_date: string;
  status: 'PENDING' | 'KEPT' | 'BROKEN';
}

interface TimelineEntry {
  id: string;
  type: 'sms' | 'email' | 'voice';
  direction: 'outbound' | 'inbound';
  timestamp: string;
  content?: string;
  subject?: string;
  body?: string;
  duration_seconds?: number;
  outcome?: string;
  transcript?: { speaker: string; text: string }[];
  payment_link?: PaymentLink;
  promise?: PromiseRecord;
}

interface HistoryResponse {
  debtor: DebtorProfile;
  timeline: TimelineEntry[];
}

interface Props {
  debtorId: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ── helpers ── */

function formatFullTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

const tierStyle: Record<number, string> = {
  1: 'text-status-green bg-status-green/10 border-status-green/20',
  2: 'text-status-yellow bg-status-yellow/10 border-status-yellow/20',
  3: 'text-status-red bg-status-red/10 border-status-red/20',
};

function statusBadgeClass(s: string) {
  const l = s.toLowerCase();
  if (l === 'paid' || l === 'kept') return 'text-status-green bg-status-green/10 border-status-green/20';
  if (l === 'active' || l === 'pending' || l.includes('negoti') || l.includes('progress')) return 'text-status-yellow bg-status-yellow/10 border-status-yellow/20';
  if (l === 'broken' || l === 'escalated' || l === 'ceased') return 'text-status-red bg-status-red/10 border-status-red/20';
  if (l === 'expired' || l === 'paused') return 'text-muted-foreground bg-muted border-border';
  return 'text-primary bg-primary/10 border-primary/20';
}

function ChannelIcon({ type }: { type: string }) {
  if (type === 'sms') return <MessageSquare className="w-4 h-4" />;
  if (type === 'email') return <Mail className="w-4 h-4" />;
  return <Headset className="w-4 h-4" />;
}

/* ── confirm dialog ── */

function InlineConfirm({ title, message, onConfirm, onCancel, loading, destructive }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean; destructive?: boolean }) {
  return (
    <div className="bg-muted border border-border rounded-lg p-4 space-y-3">
      <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{message}</p>
      <div className="flex gap-2">
        <NeonButton size="sm" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</NeonButton>
        <NeonButton size="sm" variant="solid" onClick={onConfirm} loading={loading} className={destructive ? 'bg-destructive hover:bg-destructive/90' : ''}>
          Confirm
        </NeonButton>
      </div>
    </div>
  );
}

/* ── main ── */

export default function ConversationHistory({ debtorId, isOpen, onClose }: Props) {
  const [debtor, setDebtor] = useState<DebtorProfile | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<'escalate' | 'cease' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !debtorId) return;
    setLoading(true);
    setExpandedIds(new Set());
    setConfirmAction(null);
    apiClient.get(`/debtors/${debtorId}/history`)
      .then((data: HistoryResponse) => {
        setDebtor(data.debtor ?? null);
        setTimeline(data.timeline ?? []);
      })
      .catch(() => {
        setDebtor(null);
        setTimeline([]);
      })
      .finally(() => setLoading(false));
  }, [isOpen, debtorId]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEscalate = async () => {
    setActionLoading(true);
    try {
      await apiClient.post('/agents/takeover/request', { debtorId });
    } catch { /* */ }
    setActionLoading(false);
    setConfirmAction(null);
    onClose();
  };

  const handleCease = async () => {
    setActionLoading(true);
    try {
      await apiClient.post(`/debtors/${debtorId}/cease`);
    } catch { /* */ }
    setActionLoading(false);
    setConfirmAction(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      {/* backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* panel */}
      <div
        className="relative w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ── header ── */}
        <div className="flex items-start justify-between p-5 border-b border-border shrink-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : debtor ? (
            <div className="space-y-2 flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground">{debtor.first_name} {debtor.last_name}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{debtor.phone}</span>
                {debtor.email && <span>{debtor.email}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${statusBadgeClass(debtor.status)}`}>{debtor.status}</span>
                <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${tierStyle[debtor.tier] ?? tierStyle[1]}`}>Tier {debtor.tier}</span>
                <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Layer {debtor.negotiation_layer}</span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span>Balance: <span className="font-mono text-foreground">${debtor.balance.toFixed(2)}</span></span>
                <span>Floor: <span className="font-mono text-foreground">${debtor.floor.toFixed(2)}</span></span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Debtor not found</span>
          )}
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── timeline ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No contact history yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">AI outreach will appear here once initiated.</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* vertical line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              {timeline.map(entry => {
                const expanded = expandedIds.has(entry.id);
                const hasExpandable = (entry.type === 'email' && entry.body) || (entry.type === 'voice' && entry.transcript && entry.transcript.length > 0);

                return (
                  <div key={entry.id} className="relative pl-10 pb-4">
                    {/* dot */}
                    <div className="absolute left-2 top-3 w-[14px] h-[14px] rounded-full bg-card border-2 border-border flex items-center justify-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${entry.type === 'voice' ? 'bg-primary' : entry.type === 'email' ? 'bg-status-yellow' : 'bg-status-green'}`} />
                    </div>

                    <div className="bg-muted/50 border border-border rounded-lg overflow-hidden hover:border-muted-foreground/20 transition-colors">
                      {/* entry header */}
                      <div
                        className={`flex items-center gap-2 px-4 py-3 ${hasExpandable ? 'cursor-pointer' : ''}`}
                        onClick={() => hasExpandable && toggleExpand(entry.id)}
                      >
                        <span className="text-muted-foreground"><ChannelIcon type={entry.type} /></span>
                        {entry.direction === 'outbound'
                          ? <ArrowRight className="w-3 h-3 text-primary" />
                          : <ArrowLeft className="w-3 h-3 text-status-green" />}
                        <span className="text-[10px] font-mono text-muted-foreground flex-1">{formatFullTime(entry.timestamp)}</span>
                        {entry.type === 'voice' && entry.duration_seconds != null && (
                          <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(entry.duration_seconds)}</span>
                        )}
                        {entry.type === 'voice' && entry.outcome && (
                          <span className={`text-[9px] font-medium border rounded-full px-1.5 py-0.5 ${statusBadgeClass(entry.outcome)}`}>{entry.outcome}</span>
                        )}
                        {hasExpandable && (
                          expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>

                      {/* preview line */}
                      <div className="px-4 pb-3 -mt-1">
                        {entry.type === 'sms' && entry.content && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{entry.content}</p>
                        )}
                        {entry.type === 'email' && entry.subject && (
                          <p className="text-xs text-foreground">{entry.subject}</p>
                        )}
                        {entry.type === 'voice' && !entry.outcome && (
                          <p className="text-xs text-muted-foreground italic">Voice call</p>
                        )}
                      </div>

                      {/* expanded content */}
                      {expanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3">
                          {entry.type === 'email' && entry.body && (
                            <div className="bg-background/50 rounded-md p-3">
                              <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{entry.body}</p>
                            </div>
                          )}
                          {entry.type === 'voice' && entry.transcript && entry.transcript.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[10px] text-muted-foreground font-medium">Transcript</p>
                              <div className="bg-background/50 rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                                {entry.transcript.map((line, i) => (
                                  <div key={i} className={`flex gap-2 ${line.speaker !== 'AI' ? 'flex-row-reverse' : ''}`}>
                                    <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                      line.speaker === 'AI' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                    }`}>{line.speaker}</span>
                                    <p className={`text-xs leading-relaxed ${line.speaker === 'AI' ? 'text-foreground' : 'text-muted-foreground'}`}>{line.text}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* payment link */}
                      {entry.payment_link && (
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <a href={entry.payment_link.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline truncate max-w-[200px]">
                            {entry.payment_link.url}
                          </a>
                          <span className={`text-[9px] font-medium border rounded-full px-1.5 py-0.5 ${statusBadgeClass(entry.payment_link.status)}`}>
                            {entry.payment_link.status}
                          </span>
                        </div>
                      )}

                      {/* promise */}
                      {entry.promise && (
                        <div className="px-4 pb-3 flex items-center gap-3 text-xs">
                          <span className="text-muted-foreground">Promise:</span>
                          <span className="font-mono text-foreground">${entry.promise.amount.toFixed(2)}</span>
                          <span className="text-muted-foreground">due {new Date(entry.promise.due_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}</span>
                          <span className={`text-[9px] font-medium border rounded-full px-1.5 py-0.5 ${statusBadgeClass(entry.promise.status)}`}>
                            {entry.promise.status}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── bottom actions ── */}
        <div className="shrink-0 border-t border-border p-4 space-y-3">
          {confirmAction === 'escalate' && (
            <InlineConfirm
              title="Escalate to Human"
              message="This will pause AI outreach and notify the Kollection team for manual handling. Continue?"
              onConfirm={handleEscalate}
              onCancel={() => setConfirmAction(null)}
              loading={actionLoading}
            />
          )}
          {confirmAction === 'cease' && (
            <InlineConfirm
              title="Mark Cease & Desist"
              message="All contact with this debtor will stop permanently. This action cannot be undone."
              onConfirm={handleCease}
              onCancel={() => setConfirmAction(null)}
              loading={actionLoading}
              destructive
            />
          )}
          {!confirmAction && (
            <div className="flex items-center gap-2">
              <NeonButton size="sm" variant="outline" onClick={() => setConfirmAction('escalate')}>
                <AlertTriangle className="w-3 h-3" /> Escalate to Human
              </NeonButton>
              <NeonButton size="sm" variant="outline" onClick={() => setConfirmAction('cease')} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                Cease &amp; Desist
              </NeonButton>
              <div className="flex-1" />
              <NeonButton size="sm" variant="ghost" onClick={onClose}>Close</NeonButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
