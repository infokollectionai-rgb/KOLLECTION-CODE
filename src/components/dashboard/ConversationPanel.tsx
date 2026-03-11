import { useState, useEffect } from 'react';
import { X, MessageSquare, Mail, Mic, Phone, ExternalLink, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import NeonButton from '@/components/ui/NeonButton';

interface Interaction {
  id: string;
  type: 'sms' | 'email' | 'voice';
  direction: 'outbound' | 'inbound';
  timestamp: string;
  status: string;
  content?: string;
  subject?: string;
  duration_seconds?: number;
  outcome?: string;
  transcript?: { speaker: string; text: string }[];
  payment_link_url?: string;
}

interface DebtorInfo {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  balance: number;
  status: string;
  tier: number;
}

interface Props {
  debtor: DebtorInfo;
  onClose: () => void;
}

function channelIcon(type: string) {
  if (type === 'sms') return <MessageSquare className="w-3.5 h-3.5" />;
  if (type === 'email') return <Mail className="w-3.5 h-3.5" />;
  if (type === 'voice') return <Mic className="w-3.5 h-3.5" />;
  return <Phone className="w-3.5 h-3.5" />;
}

function channelLabel(type: string) {
  if (type === 'sms') return 'SMS';
  if (type === 'email') return 'Email';
  if (type === 'voice') return 'Voice Call';
  return type;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const dirBadge = {
  outbound: 'text-primary bg-primary/10 border-primary/20',
  inbound: 'text-status-green bg-status-green/10 border-status-green/20',
};

export default function ConversationPanel({ debtor, onClose }: Props) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sms' | 'email' | 'voice'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/debtors/${debtor.id}/conversations`)
      .then((data: any) => setInteractions(data.interactions ?? data ?? []))
      .catch(() => setInteractions([]))
      .finally(() => setLoading(false));
  }, [debtor.id]);

  const filtered = filter === 'all' ? interactions : interactions.filter(i => i.type === filter);

  const tierStyle: Record<number, string> = {
    1: 'text-status-green bg-status-green/10 border-status-green/20',
    2: 'text-status-yellow bg-status-yellow/10 border-status-yellow/20',
    3: 'text-status-red bg-status-red/10 border-status-red/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {debtor.first_name} {debtor.last_name}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="font-mono text-xs text-muted-foreground">{debtor.phone}</span>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="font-mono text-xs text-foreground">${debtor.balance.toFixed(2)}</span>
              <span className={`text-[10px] font-medium border rounded-full px-2 py-0.5 ${tierStyle[debtor.tier] ?? tierStyle[1]}`}>
                Tier {debtor.tier}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel filter */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-border">
          {(['all', 'sms', 'email', 'voice'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${
                filter === f
                  ? 'bg-primary/10 text-primary border border-primary/25'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              {f === 'all' ? 'All' : f.toUpperCase()}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {filtered.length} interaction{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No interactions yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">AI outreach will appear here once initiated.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const expanded = expandedId === item.id;
                return (
                  <div
                    key={item.id}
                    className="bg-muted/50 border border-border rounded-lg overflow-hidden hover:border-muted-foreground/20 transition-colors"
                  >
                    {/* Row header */}
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    >
                      <div className="text-muted-foreground">{channelIcon(item.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{channelLabel(item.type)}</span>
                          <span className={`text-[9px] font-medium border rounded-full px-1.5 py-0.5 ${dirBadge[item.direction] ?? dirBadge.outbound}`}>
                            {item.direction === 'inbound' ? 'IN' : 'OUT'}
                          </span>
                          {item.type === 'voice' && item.duration_seconds != null && (
                            <span className="text-[10px] font-mono text-muted-foreground">{formatDuration(item.duration_seconds)}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {item.subject ?? item.content?.slice(0, 80) ?? item.outcome ?? '—'}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(item.timestamp)}</span>
                    </button>

                    {/* Expanded content */}
                    {expanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-border/50 space-y-3">
                        {/* SMS / Email content */}
                        {(item.type === 'sms' || item.type === 'email') && item.content && (
                          <div className="bg-background/50 rounded-md p-3">
                            {item.subject && <p className="text-[11px] font-medium text-foreground mb-1">{item.subject}</p>}
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.content}</p>
                          </div>
                        )}

                        {/* Voice transcript */}
                        {item.type === 'voice' && item.transcript && item.transcript.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground font-medium">Transcript</p>
                            <div className="bg-background/50 rounded-md p-3 space-y-2 max-h-64 overflow-y-auto">
                              {item.transcript.map((line, i) => (
                                <div key={i} className={`flex gap-2 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                                  <span className={`text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0 ${
                                    line.speaker === 'AI' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {line.speaker}
                                  </span>
                                  <p className={`text-xs leading-relaxed ${line.speaker === 'AI' ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {line.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Voice outcome */}
                        {item.type === 'voice' && item.outcome && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground">Outcome:</span>
                            <span className="text-[10px] font-medium text-foreground">{item.outcome}</span>
                          </div>
                        )}

                        {/* Payment link */}
                        {item.payment_link_url && (
                          <a
                            href={item.payment_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Payment link
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
