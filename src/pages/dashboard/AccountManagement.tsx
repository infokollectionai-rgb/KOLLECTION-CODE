import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockDebtors, mockActivityLog } from '@/data/mockData';
import { X, Search, Download, FileText } from 'lucide-react';
import { requestTakeover, returnToAI } from '@/services/aiAgent';

const statusBadge = (s: string) => s === 'Paid' ? 'green' as const : s === 'Escalated' || s === 'Manual' ? 'red' as const : s === 'Negotiating' ? 'yellow' as const : 'blue' as const;

export default function AccountManagement() {
  const [selected, setSelected] = useState<typeof mockDebtors[0] | null>(null);
  const [search, setSearch] = useState('');
  const [showTakeoverConfirm, setShowTakeoverConfirm] = useState(false);
  const [takeoverRequested, setTakeoverRequested] = useState(false);
  const [clientNote, setClientNote] = useState('');

  const filtered = mockDebtors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
  );

  const accountActivity = selected ? mockActivityLog.filter(a => a.debtor === selected.name) : [];

  const handleTakeover = async () => {
    if (selected) {
      await requestTakeover({ debtorId: selected.id, requestedBy: 'client' });
      setTakeoverRequested(true);
      setShowTakeoverConfirm(false);
    }
  };

  const handleReturnToAI = async () => {
    if (selected) {
      await returnToAI({ debtorId: selected.id });
      setTakeoverRequested(false);
    }
  };

  return (
    <PageWrapper title="Accounts">
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search accounts..."
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 outline-none transition-colors" />
        </div>
        <NeonButton size="sm"><Download className="w-3 h-3" /> Export CSV</NeonButton>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Name', 'Original Balance', 'Recovered', 'Recovery %', 'Status', 'Last Activity', ''].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center">
                <Search className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No accounts found</p>
              </td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3 text-foreground font-medium">{d.name}</td>
                <td className="px-5 py-3 font-mono">${d.balance.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${d.recovered.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono">{d.balance > 0 ? Math.round((d.recovered / d.balance) * 100) : 0}%</td>
                <td className="px-5 py-3"><StatusBadge variant={statusBadge(d.status)}>{d.status}</StatusBadge></td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{d.lastAction}</td>
                <td className="px-5 py-3">
                  <button onClick={() => { setSelected(d); setTakeoverRequested(false); setClientNote(''); }} className="text-xs text-primary hover:underline">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-semibold text-foreground">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Original Balance', value: `$${selected.balance.toLocaleString()}` },
                  { label: 'Recovered', value: `$${selected.recovered.toLocaleString()}` },
                  { label: 'Recovery %', value: `${selected.balance > 0 ? Math.round((selected.recovered / selected.balance) * 100) : 0}%` },
                  { label: 'Days Overdue', value: selected.daysOverdue.toString() },
                  { label: 'AI Stage', value: selected.aiStage },
                  { label: 'Contact Attempts', value: selected.attempts.toString() },
                ].map((item, i) => (
                  <div key={i} className="bg-muted rounded-md p-3">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="font-mono text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              <h3 className="text-xs text-muted-foreground mb-3">Activity Timeline</h3>
              <div className="space-y-2 mb-6">
                {accountActivity.length > 0 ? accountActivity.map(a => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-border/30">
                    <span className="font-mono text-[10px] text-muted-foreground w-28 flex-shrink-0">{a.timestamp}</span>
                    <div>
                      <StatusBadge variant={a.type.includes('Payment') ? 'green' : a.type.includes('Escalat') || a.type.includes('Broken') ? 'red' : 'blue'}>{a.type}</StatusBadge>
                      <p className="text-xs text-foreground mt-1">{a.outcome}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No activity recorded yet</p>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-5">
                {!takeoverRequested ? (
                  <NeonButton size="sm" className="w-full" onClick={() => setShowTakeoverConfirm(true)}>Request Manual Takeover</NeonButton>
                ) : (
                  <div className="bg-status-yellow/8 border border-status-yellow/15 rounded-md p-4">
                    <p className="text-xs text-status-yellow font-medium mb-1">Manual Takeover Requested</p>
                    <p className="text-xs text-muted-foreground">A Kollection team member will contact you within 4 business hours.</p>
                    <button onClick={handleReturnToAI} className="text-xs text-primary mt-2 hover:underline">Return to AI</button>
                  </div>
                )}

                <div>
                  <label className="text-[11px] text-muted-foreground mb-1 block">Add a Note</label>
                  <textarea value={clientNote} onChange={e => setClientNote(e.target.value)} placeholder="Internal note visible to your team and Kollection..."
                    className="w-full bg-muted border border-border rounded-md p-3 text-sm text-foreground resize-none h-16 focus:border-primary/30 outline-none transition-colors" />
                </div>

                <NeonButton size="sm" variant="ghost" className="w-full"><FileText className="w-3 h-3" /> Download Account Report</NeonButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTakeoverConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowTakeoverConfirm(false)} />
          <div className="relative bg-card border border-border rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Confirm Manual Takeover</h3>
            <p className="text-xs text-muted-foreground mb-5">Taking manual control will pause AI recovery on this account. A team member will reach out to coordinate the handoff.</p>
            <div className="flex gap-2 justify-end">
              <NeonButton size="sm" variant="ghost" onClick={() => setShowTakeoverConfirm(false)}>Cancel</NeonButton>
              <NeonButton size="sm" variant="solid" onClick={handleTakeover}>Confirm Takeover</NeonButton>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
