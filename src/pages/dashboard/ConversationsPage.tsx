import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockConversations } from '@/data/mockData';
import { Search, AlertTriangle, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { requestTakeover, returnToAI } from '@/services/aiAgent';

const statusFilter = ['All', 'Active', 'Committed', 'Manual'] as const;

export default function ConversationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [takeoverReason, setTakeoverReason] = useState('');
  const [takeoverRequested, setTakeoverRequested] = useState<Set<string>>(new Set());
  const [expandedCalls, setExpandedCalls] = useState<Set<number>>(new Set());

  const filtered = mockConversations.filter(c => {
    if (filter !== 'All' && c.status !== filter) return false;
    if (search && !c.debtor.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = mockConversations.find(c => c.id === selectedId);

  const statusBadge = (s: string) =>
    s === 'Committed' ? 'green' as const :
    s === 'Manual' ? 'red' as const :
    s === 'Active' ? 'blue' as const : 'neutral' as const;

  const handleTakeover = async () => {
    if (selectedId) {
      await requestTakeover({ debtorId: selected?.debtorId || '', requestedBy: 'client', reason: takeoverReason });
      setTakeoverRequested(prev => new Set(prev).add(selectedId));
    }
    setShowTakeoverModal(false);
    setTakeoverReason('');
  };

  const handleReturnToAI = async () => {
    if (selectedId) {
      await returnToAI({ debtorId: selected?.debtorId || '' });
      setTakeoverRequested(prev => {
        const next = new Set(prev);
        next.delete(selectedId);
        return next;
      });
    }
  };

  const toggleCallExpand = (idx: number) => {
    setExpandedCalls(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <PageWrapper title="Conversations">
      <div className="flex h-[calc(100vh-140px)] border border-border rounded-lg overflow-hidden bg-card">
        {/* Left: List */}
        <div className={`w-full md:w-[320px] flex-shrink-0 border-r border-border flex flex-col ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search debtors..."
                className="w-full bg-muted border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none" />
            </div>
            <div className="flex gap-1">
              {statusFilter.map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded text-[10px] transition-colors ${filter === f ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${selectedId === c.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.debtor}</span>
                  <StatusBadge variant={statusBadge(c.status)}>{c.status}</StatusBadge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.messages[c.messages.length - 1]?.text}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">{c.channel}</span>
                  <span className="text-[10px] text-muted-foreground">{c.lastActivity}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Thread */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="md:hidden text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selected.debtor}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{selected.channel}</span><span>·</span><span>{selected.stage}</span>
                    </div>
                  </div>
                </div>
                <StatusBadge variant={statusBadge(selected.status)}>{selected.status}</StatusBadge>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map((msg, i) => {
                  if (msg.role === 'system') {
                    return (
                      <div key={i} className="text-center py-2">
                        <p className="text-[10px] text-muted-foreground bg-muted inline-block px-3 py-1 rounded-full">{msg.text}</p>
                      </div>
                    );
                  }
                  const isAI = msg.role === 'ai';
                  const msgAny = msg as any;
                  const isCall = msgAny.isCall;

                  return (
                    <div key={i} className={`flex ${isAI ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg p-3 ${isAI ? 'bg-primary/8 border border-primary/15' : 'bg-muted'}`}>
                        {'stage' in msg && msg.stage && <p className="text-[9px] text-muted-foreground mb-1 font-mono">{msg.stage}</p>}

                        {isCall ? (
                          <div>
                            <button onClick={() => toggleCallExpand(i)} className="flex items-center gap-2 text-sm text-foreground">
                              <span>{msg.text}</span>
                              {expandedCalls.has(i) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {expandedCalls.has(i) && msgAny.transcript && (
                              <div className="mt-2 pt-2 border-t border-border/50 space-y-1.5">
                                {msgAny.transcript.map((t: any, ti: number) => (
                                  <div key={ti} className="text-xs">
                                    <span className={`font-mono text-[10px] ${t.speaker === 'AI' ? 'text-primary' : 'text-muted-foreground'}`}>{t.speaker}:</span>
                                    <span className="text-foreground ml-1.5">{t.text}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-1.5">{msg.time}</p>
                      </div>
                    </div>
                  );
                })}

                {takeoverRequested.has(selected.id) && (
                  <div className="bg-destructive/8 border border-destructive/15 rounded-lg p-4 text-center">
                    <p className="text-xs text-destructive font-medium mb-1">Manual Takeover Requested</p>
                    <p className="text-xs text-muted-foreground mb-2">A Kollection team member will contact you within 4 business hours.</p>
                    <button onClick={handleReturnToAI} className="text-xs text-primary hover:underline">Return to AI</button>
                  </div>
                )}
              </div>

              {(selected.status === 'Active' || selected.status === 'Committed') && !takeoverRequested.has(selected.id) && (
                <div className="border-t border-border p-3">
                  <NeonButton size="sm" className="text-destructive border-destructive/30" onClick={() => setShowTakeoverModal(true)}>
                    <AlertTriangle className="w-3 h-3" /> Request Manual Takeover
                  </NeonButton>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          )}
        </div>
      </div>

      {/* Takeover modal */}
      {showTakeoverModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowTakeoverModal(false)} />
          <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">Request Manual Takeover?</h3>
            <p className="text-xs text-muted-foreground mb-4">
              AI recovery will pause on this account. A Kollection team member will contact you within 4 hours.
            </p>
            <div className="mb-4">
              <label className="text-[11px] text-muted-foreground mb-1 block">Reason (optional)</label>
              <input value={takeoverReason} onChange={e => setTakeoverReason(e.target.value)}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
            </div>
            <div className="flex gap-2 justify-end">
              <NeonButton size="sm" variant="ghost" onClick={() => setShowTakeoverModal(false)}>Cancel</NeonButton>
              <NeonButton size="sm" variant="solid" onClick={handleTakeover}>Confirm Takeover</NeonButton>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
