import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockDebtors, mockConversations } from '@/data/mockData';
import { useNegotiation, useReturnToAI } from '@/services/ai/agentHooks';
import { useState } from 'react';
import { Bot, ArrowLeft } from 'lucide-react';

const escalatedAccounts = mockDebtors.filter(d => d.status === 'Escalated');

export default function HumanTakeover() {
  const [selected, setSelected] = useState<typeof escalatedAccounts[0] | null>(null);
  const negotiation = useNegotiation();
  const returnAI = useReturnToAI();

  return (
    <PageWrapper title="Human Takeover Queue">
      <div className="grid lg:grid-cols-5 gap-6 h-[calc(100vh-160px)]">
        {/* Queue */}
        <div className={`${selected ? 'lg:col-span-2' : 'lg:col-span-5'} bg-panel border border-border rounded-xl overflow-hidden`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Amount', 'Reason', 'Priority'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {escalatedAccounts.length === 0 ? (
                <tr><td colSpan={4} className="py-16 text-center">
                  <Bot className="w-6 h-6 text-neon/30 mx-auto mb-2" />
                  <p className="font-mono text-sm text-muted-foreground tracking-widest">NO DATA YET</p>
                </td></tr>
              ) : escalatedAccounts.map(d => (
                <tr key={d.id} onClick={() => setSelected(d)} className={`border-b border-border/30 cursor-pointer transition-colors ${selected?.id === d.id ? 'bg-neon/10' : 'hover:bg-neon/5'}`}>
                  <td className="px-4 py-3 text-foreground font-semibold">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-neon">${d.amount.toLocaleString()}</td>
                  <td className="px-4 py-3"><NeonBadge variant="red">{d.aiStage}</NeonBadge></td>
                  <td className="px-4 py-3"><NeonBadge variant="red">HIGH</NeonBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail */}
        {selected && (
          <div className="lg:col-span-3 bg-panel border border-border rounded-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-sm font-bold tracking-widest">{selected.name}</h3>
              <NeonButton size="sm" loading={returnAI.loading} onClick={() => returnAI.returnToAI({ debtorId: selected.id })}>
                <ArrowLeft className="w-3 h-3" /> Return to AI
              </NeonButton>
            </div>

            <div className="bg-deep rounded-lg p-4 mb-4">
              <p className="text-[10px] font-mono text-muted-foreground tracking-widest mb-2 uppercase">Debtor Summary</p>
              <div className="grid grid-cols-3 gap-3">
                <div><p className="text-[9px] font-mono text-muted-foreground">Debt</p><p className="font-mono text-neon">${selected.amount.toLocaleString()}</p></div>
                <div><p className="text-[9px] font-mono text-muted-foreground">Tier</p><p className="font-mono">Tier {selected.tier}</p></div>
                <div><p className="text-[9px] font-mono text-muted-foreground">Days OD</p><p className="font-mono">{selected.daysOverdue}</p></div>
              </div>
            </div>

            <NeonButton size="sm" className="mb-4" loading={negotiation.loading} onClick={() => negotiation.suggest({ debtorId: selected.id, tier: selected.tier, floorAmount: selected.amount * 0.5 })}>
              <Bot className="w-3 h-3" /> Get AI Suggestion
            </NeonButton>

            {negotiation.suggestion && (
              <div className="bg-neon/5 border border-neon/20 rounded-lg p-4 mb-4">
                <p className="text-[10px] font-mono text-neon tracking-widest mb-2 uppercase">AI Suggestion</p>
                <textarea
                  defaultValue={negotiation.suggestion.suggestedMessage}
                  className="w-full bg-panel border border-border rounded-md p-3 text-sm text-foreground resize-none h-20 focus:border-neon/40 outline-none transition-all"
                />
              </div>
            )}

            <textarea
              placeholder="Type manual message..."
              className="w-full bg-deep border border-border rounded-md p-3 text-sm text-foreground resize-none h-20 focus:border-neon/40 outline-none transition-all mb-3"
            />
            <NeonButton variant="solid" size="sm">Send Manual Message</NeonButton>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
