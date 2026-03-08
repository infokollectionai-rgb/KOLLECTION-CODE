import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockConversations } from '@/data/mockData';
import { Search, ArrowLeft, Sparkles, Phone, MessageSquare, CreditCard } from 'lucide-react';
import { getNegotiationSuggestion, sendOutreach } from '@/services/aiAgent';
import { initiateCall } from '@/services/outcallAgent';
import { createPaymentLink } from '@/services/stripe';

export default function AdminConversations() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [loading, setLoading] = useState('');

  const filtered = mockConversations.filter(c =>
    !search || c.debtor.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())
  );

  const selected = mockConversations.find(c => c.id === selectedId);

  const statusBadge = (s: string) =>
    s === 'Committed' ? 'green' as const :
    s === 'Manual' ? 'red' as const :
    s === 'Active' ? 'blue' as const : 'neutral' as const;

  const handleGetSuggestion = async () => {
    if (!selected) return;
    setLoading('suggestion');
    const result = await getNegotiationSuggestion({ debtorId: selected.debtorId, tier: 2, balance: 850, floor: 500 });
    setAiSuggestion(result.suggestion);
    setLoading('');
  };

  const handleSendSMS = async () => {
    if (!selected) return;
    setLoading('sms');
    await sendOutreach({ debtorId: selected.debtorId, debtorName: selected.debtor, channel: 'sms', amount: 850, tier: 2, companyName: selected.company });
    setLoading('');
  };

  const handleCall = async () => {
    if (!selected) return;
    setLoading('call');
    await initiateCall({ debtorId: selected.debtorId, debtorName: selected.debtor, phone: '+15551234567', balance: 850, companyName: selected.company });
    setLoading('');
  };

  const handlePaymentLink = async () => {
    if (!selected) return;
    setLoading('payment');
    await createPaymentLink({ debtorId: selected.debtorId, amount: 850, description: `Recovery - ${selected.company}` });
    setLoading('');
  };

  return (
    <PageWrapper title="All Conversations">
      <div className="flex h-[calc(100vh-140px)] border border-border rounded-lg overflow-hidden bg-card">
        {/* List */}
        <div className={`w-full md:w-[340px] flex-shrink-0 border-r border-border flex flex-col ${selected ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by debtor or company..."
                className="w-full bg-muted border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedId(c.id); setAiSuggestion(''); }}
                className={`w-full text-left px-4 py-3 border-b border-border/50 transition-colors ${selectedId === c.id ? 'bg-primary/5' : 'hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{c.debtor}</span>
                  <StatusBadge variant={statusBadge(c.status)}>{c.status}</StatusBadge>
                </div>
                <p className="text-[10px] text-primary font-mono mb-1">{c.company}</p>
                <p className="text-xs text-muted-foreground truncate">{c.messages[c.messages.length - 1]?.text}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Thread + Tools */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {selected ? (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="md:hidden text-muted-foreground"><ArrowLeft className="w-4 h-4" /></button>
                  <div>
                    <p className="text-sm font-medium text-foreground">{selected.debtor}</p>
                    <p className="text-[10px] font-mono text-primary">{selected.company}</p>
                  </div>
                </div>
                <StatusBadge variant={statusBadge(selected.status)}>{selected.status}</StatusBadge>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* Messages */}
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
                    return (
                      <div key={i} className={`flex ${isAI ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-lg p-3 ${isAI ? 'bg-primary/8 border border-primary/15' : 'bg-muted'}`}>
                          {'stage' in msg && msg.stage && <p className="text-[9px] text-muted-foreground mb-1 font-mono">{msg.stage}</p>}
                          <p className="text-sm text-foreground leading-relaxed">{msg.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-1.5">{msg.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Admin tools panel */}
                <div className="w-[200px] border-l border-border p-3 space-y-2 hidden lg:block">
                  <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">AI TOOLS</p>
                  <NeonButton size="sm" className="w-full justify-start text-[11px]" loading={loading === 'suggestion'} onClick={handleGetSuggestion}>
                    <Sparkles className="w-3 h-3" /> Get Suggestion
                  </NeonButton>
                  <NeonButton size="sm" className="w-full justify-start text-[11px]" loading={loading === 'sms'} onClick={handleSendSMS}>
                    <MessageSquare className="w-3 h-3" /> Send SMS
                  </NeonButton>
                  <NeonButton size="sm" className="w-full justify-start text-[11px]" loading={loading === 'call'} onClick={handleCall}>
                    <Phone className="w-3 h-3" /> Initiate Call
                  </NeonButton>
                  <NeonButton size="sm" className="w-full justify-start text-[11px]" loading={loading === 'payment'} onClick={handlePaymentLink}>
                    <CreditCard className="w-3 h-3" /> Payment Link
                  </NeonButton>

                  {aiSuggestion && (
                    <div className="mt-3 p-2 bg-muted border border-border rounded text-xs text-foreground leading-relaxed">
                      <p className="text-[9px] font-mono text-primary mb-1">AI SUGGESTION</p>
                      {aiSuggestion}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
