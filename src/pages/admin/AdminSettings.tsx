import PageWrapper from '@/components/layout/PageWrapper';
import NeonButton from '@/components/ui/NeonButton';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <PageWrapper title="Platform Settings">
      <div className="bg-panel border border-border rounded-xl p-8 max-w-lg">
        <h3 className="font-display text-sm font-bold tracking-widest mb-6">GLOBAL AI CONFIGURATION</h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">Default Commission Rate (%)</label>
            <input type="number" defaultValue={20} className="bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground w-full focus:border-neon/40 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-mono tracking-widest text-muted-foreground mb-2 uppercase">AI Model Version</label>
            <select className="bg-deep border border-border rounded-md px-4 py-2.5 text-sm text-foreground w-full focus:border-neon/40 outline-none transition-all">
              <option>v2.1 — Production</option>
              <option>v2.0 — Stable</option>
              <option>v3.0 — Beta</option>
            </select>
          </div>
          <NeonButton variant="solid"><Save className="w-3 h-3" /> Save Settings</NeonButton>
        </div>
      </div>
    </PageWrapper>
  );
}
