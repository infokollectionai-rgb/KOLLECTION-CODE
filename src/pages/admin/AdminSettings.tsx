import PageWrapper from '@/components/layout/PageWrapper';
import NeonButton from '@/components/ui/NeonButton';
import { Save } from 'lucide-react';

export default function AdminSettings() {
  return (
    <PageWrapper title="Platform Settings">
      <div className="bg-panel border border-border rounded-lg p-6 max-w-lg">
        <h3 className="text-sm font-semibold text-foreground mb-6">Global Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Default Setup Fee ($)</label>
            <input type="number" defaultValue={299} className="w-full bg-raised border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:border-neon/30 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">Recovery Fee Rate (%)</label>
            <input type="number" defaultValue={50} className="w-full bg-raised border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:border-neon/30 outline-none transition-colors" />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block">AI Model Version</label>
            <select className="w-full bg-raised border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none">
              <option>v2.1 — Production</option>
              <option>v2.0 — Stable</option>
              <option>v3.0 — Beta</option>
            </select>
          </div>
          <NeonButton variant="solid" size="sm"><Save className="w-3 h-3" /> Save Settings</NeonButton>
        </div>
      </div>
    </PageWrapper>
  );
}
