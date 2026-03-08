import { useState } from 'react';
import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import ChannelIcon from '@/components/ui/ChannelIcon';
import { mockConversations } from '@/data/mockData';
import { useNegotiation, useEscalation } from '@/services/ai/agentHooks';
import { Bot, UserCheck } from 'lucide-react';

export default function ConversationsPanel() {
  const [activeConv, setActiveConv] = useState(mockConversations[0]);
  const negotiation = useNegotiation();
  const escalation = useEscalation();

  return (
    <PageWrapper title="AI Conversations">
      <div className="flex gap-0 h-[calc(100vh-160px)] -mx-8 -mb-8">
        {/* Left: Conversation List */}
        <div className="w-[350px] border-r border-border overflow-y-auto bg-deep flex-shrink-0">
          {mockConversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => setActiveConv(conv)}
              className={`p-4 border-b border-border/50 cursor-pointer transition-all ${
                activeConv.id === conv.id ? 'bg-neon/10 border-l-2 border-l-neon' : 'hover:bg-neon/5 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <ChannelIcon channel={conv.channel} className="w-3 h-3" />
                <span className="font-semibold text-sm text-foreground">{conv.debtor}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{conv.messages[conv.messages.length - 1].text}</p>
              <div className="flex items-center gap-2 mt-2">
                <NeonBadge variant={conv.status === 'Active' ? 'green' : 'yellow'}>{conv.aiStage}</NeonBadge>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Transcript */}
        <div className="flex-1 flex flex-col bg-base">
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChannelIcon channel={activeConv.channel} />
              <div>
                <h3 className="font-semibold text-foreground">{activeConv.debtor}</h3>
                <p className="text-[10px] font-mono text-muted-foreground tracking-widest">{activeConv.channel} · {activeConv.aiStage}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <NeonButton size="sm" loading={negotiation.loading} onClick={() => negotiation.suggest({ debtorId: activeConv.debtorId, tier: 2, floorAmount: 2000 })}>
                <Bot className="w-3 h-3" /> AI Suggestion
              </NeonButton>
              <NeonButton size="sm" variant="outline" className="border-status-red/50 text-status-red" loading={escalation.loading} onClick={() => escalation.escalate({ debtorId: activeConv.debtorId, reason: 'Manual takeover' })}>
                <UserCheck className="w-3 h-3" /> Take Over
              </NeonButton>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeConv.messages.map((msg, i) => {
              const isAi = msg.role === 'ai';
              return (
                <div key={i} className={`flex ${isAi ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isAi ? 'order-1' : ''}`}>
                    {isAi && msg.stage && (
                      <p className="text-[9px] font-mono tracking-widest text-neon/60 mb-1 text-right uppercase">[{msg.stage}]</p>
                    )}
                    <div className={`rounded-lg px-4 py-3 text-sm ${
                      isAi
                        ? 'bg-neon/10 border border-neon/20 text-foreground'
                        : 'bg-raised border border-border text-foreground'
                    }`}>
                      {msg.text}
                    </div>
                    <p className={`text-[10px] font-mono text-muted-foreground mt-1 ${isAi ? 'text-right' : ''}`}>{msg.time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Suggestion */}
          {negotiation.suggestion && (
            <div className="p-4 border-t border-border bg-deep">
              <p className="text-[10px] font-mono text-neon tracking-widest mb-2 uppercase">AI Suggested Response</p>
              <textarea
                defaultValue={negotiation.suggestion.suggestedMessage}
                className="w-full bg-panel border border-neon/20 rounded-md p-3 text-sm text-foreground resize-none h-20 focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-mono text-muted-foreground">
                  Confidence: {Math.round(negotiation.suggestion.confidence * 100)}% · Stage: {negotiation.suggestion.stage}
                </span>
                <NeonButton size="sm" variant="solid">Send Response</NeonButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
