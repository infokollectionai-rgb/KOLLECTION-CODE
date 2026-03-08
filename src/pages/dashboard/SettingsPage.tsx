import PageWrapper from '@/components/layout/PageWrapper';
import NeonButton from '@/components/ui/NeonButton';
import { useState } from 'react';
import { Save } from 'lucide-react';

const tabs = ['Company Profile', 'AI Behavior', 'Notifications', 'Integrations'];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('AI Behavior');
  const [tone, setTone] = useState('professional');
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [escalationTrigger, setEscalationTrigger] = useState('3_no_response');

  return (
    <PageWrapper title="Settings">
      <div className="flex gap-6 h-[calc(100vh-160px)]">
        {/* Tab list */}
        <div className="w-[200px] space-y-1 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-neon/10 text-neon border border-neon/20'
                  : 'text-muted-foreground hover:bg-neon/5 hover:text-foreground border border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-panel border border-border rounded-xl p-8">
          {activeTab === 'AI Behavior' && (
            <div className="space-y-8 max-w-lg">
              <div>
                <h3 className="font-display text-sm font-bold tracking-widest mb-1">AI BEHAVIOR CONFIG</h3>
                <p className="text-sm text-muted-foreground">Configure how the AI agents interact with debtors.</p>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">Communication Tone</label>
                <div className="flex gap-2">
                  {['professional', 'firm', 'empathetic'].map(t => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-md text-xs font-bold tracking-widest uppercase transition-all border ${
                        tone === t
                          ? 'bg-neon/20 text-neon border-neon/40 neon-glow-sm'
                          : 'border-border text-muted-foreground hover:text-foreground hover:border-border'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Escalation */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">Escalation Trigger</label>
                <select
                  value={escalationTrigger}
                  onChange={e => setEscalationTrigger(e.target.value)}
                  className="bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground focus:border-neon/40 focus:shadow-[0_0_8px_rgba(0,200,255,0.6)] outline-none transition-all w-full"
                >
                  <option value="3_no_response">3 consecutive no responses</option>
                  <option value="floor_reached">Floor amount reached</option>
                  <option value="debtor_request">Debtor requests human</option>
                  <option value="high_value">High-value account (&gt;$10K)</option>
                </select>
              </div>

              {/* Max Attempts */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">
                  Max AI Attempts: <span className="text-neon">{maxAttempts}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={maxAttempts}
                  onChange={e => setMaxAttempts(Number(e.target.value))}
                  className="w-full accent-[#00c8ff]"
                />
              </div>

              {/* Blackout */}
              <div>
                <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-3 uppercase">Blackout Hours (No Outreach)</label>
                <div className="flex gap-3 items-center">
                  <input type="time" defaultValue="21:00" className="bg-deep border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-neon/40 outline-none" />
                  <span className="text-muted-foreground">to</span>
                  <input type="time" defaultValue="08:00" className="bg-deep border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-neon/40 outline-none" />
                </div>
              </div>

              <NeonButton variant="solid"><Save className="w-3 h-3" /> Save AI Config</NeonButton>
            </div>
          )}

          {activeTab !== 'AI Behavior' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="font-mono text-sm text-muted-foreground tracking-widest">COMING SOON</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
