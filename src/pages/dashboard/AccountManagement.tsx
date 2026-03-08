import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import ChannelIcon from '@/components/ui/ChannelIcon';
import { mockDebtors } from '@/data/mockData';
import { useOutreach, useVoiceCall, usePaymentLink, useEscalation } from '@/services/ai/agentHooks';
import { X, Search, Download, Bot, MessageSquare, Phone, Mail, CreditCard, UserCheck } from 'lucide-react';

const tierBadge = (tier: number) => tier === 1 ? 'green' : tier === 2 ? 'yellow' : 'red';
const statusBadge = (s: string) => s === 'Paid' ? 'green' : s === 'Escalated' ? 'red' : s === 'Negotiating' ? 'yellow' : 'neon';

export default function AccountManagement() {
  const [selected, setSelected] = useState<typeof mockDebtors[0] | null>(null);
  const [search, setSearch] = useState('');
  const outreach = useOutreach();
  const voice = useVoiceCall();
  const payment = usePaymentLink();
  const escalation = useEscalation();

  const filtered = mockDebtors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrapper title="Account Management">
      {/* Top bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full bg-deep border border-border rounded-md pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all"
          />
        </div>
        <NeonButton variant="outline" size="sm"><Download className="w-3 h-3" /> Export CSV</NeonButton>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Name', 'Amount', 'Recovered', 'Tier', 'Status', 'AI Stage', 'Days OD', 'Attempts'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-16 text-center">
                <Search className="w-6 h-6 text-neon/30 mx-auto mb-2" />
                <p className="font-mono text-sm text-muted-foreground tracking-widest">NO DATA YET</p>
              </td></tr>
            ) : filtered.map(d => (
              <tr key={d.id} onClick={() => setSelected(d)} className="border-b border-border/30 hover:bg-neon/5 cursor-pointer transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">{d.id}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{d.name}</td>
                <td className="px-4 py-3 font-mono text-neon">${d.amount.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-status-green">${d.recovered.toLocaleString()}</td>
                <td className="px-4 py-3"><NeonBadge variant={tierBadge(d.tier)}>Tier {d.tier}</NeonBadge></td>
                <td className="px-4 py-3"><NeonBadge variant={statusBadge(d.status)}>{d.status}</NeonBadge></td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{d.aiStage}</td>
                <td className="px-4 py-3 font-mono">{d.daysOverdue}</td>
                <td className="px-4 py-3 font-mono">{d.attempts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-panel border-l border-neon/20 animate-slide-in-right overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold tracking-widest">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              {/* AI Recommendation */}
              <div className="bg-neon/5 border border-neon/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                <Bot className="w-5 h-5 text-neon flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-mono text-neon tracking-widest uppercase">AI Recommends</p>
                  <p className="text-sm text-foreground">Send Tier {selected.tier} {selected.tier === 1 ? 'soft touch' : 'firm'} SMS now</p>
                </div>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { label: 'Total Debt', value: `$${selected.amount.toLocaleString()}` },
                  { label: 'Recovered', value: `$${selected.recovered.toLocaleString()}` },
                  { label: 'Tier', value: `Tier ${selected.tier}` },
                  { label: 'Days Overdue', value: selected.daysOverdue.toString() },
                  { label: 'AI Stage', value: selected.aiStage },
                  { label: 'Attempts', value: selected.attempts.toString() },
                ].map((item, i) => (
                  <div key={i} className="bg-deep rounded-lg p-3">
                    <p className="text-[9px] font-mono text-muted-foreground tracking-widest uppercase">{item.label}</p>
                    <p className="font-mono text-sm text-foreground mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <h3 className="font-mono text-[10px] tracking-widest text-muted-foreground mb-3 uppercase">Agent Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <NeonButton size="sm" loading={outreach.loading} onClick={() => outreach.send({ debtorId: selected.id, channel: 'text' })}>
                  <MessageSquare className="w-3 h-3" /> Send SMS
                </NeonButton>
                <NeonButton size="sm" loading={voice.loading} onClick={() => voice.call({ debtorId: selected.id, phone: selected.phone })}>
                  <Phone className="w-3 h-3" /> Call
                </NeonButton>
                <NeonButton size="sm" loading={outreach.loading} onClick={() => outreach.send({ debtorId: selected.id, channel: 'email' })}>
                  <Mail className="w-3 h-3" /> Email
                </NeonButton>
                <NeonButton size="sm" loading={payment.loading} onClick={() => payment.generate({ debtorId: selected.id, amount: selected.amount - selected.recovered })}>
                  <CreditCard className="w-3 h-3" /> Pay Link
                </NeonButton>
                <NeonButton size="sm" variant="outline" className="col-span-2 border-status-red/50 text-status-red" loading={escalation.loading} onClick={() => escalation.escalate({ debtorId: selected.id, reason: 'Manual takeover requested' })}>
                  <UserCheck className="w-3 h-3" /> Manual Takeover
                </NeonButton>
              </div>

              {/* Success feedback */}
              {outreach.result && (
                <div className="mt-4 bg-status-green/10 border border-status-green/25 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-status-green tracking-widest">✓ Message sent — {outreach.result.messageId}</p>
                </div>
              )}
              {payment.link && (
                <div className="mt-4 bg-neon/10 border border-neon/25 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-neon tracking-widest">✓ Payment link: {payment.link}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
