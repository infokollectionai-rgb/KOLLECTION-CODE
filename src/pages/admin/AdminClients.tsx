import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockClients } from '@/data/mockData';
import { Pencil, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS, updateClientFees } from '@/services/adminService';
import { Slider } from '@/components/ui/slider';

export default function AdminClients() {
  const [editingClient, setEditingClient] = useState<any>(null);
  const [editSetupFee, setEditSetupFee] = useState(5000);
  const [editRecoveryPct, setEditRecoveryPct] = useState(50);
  const [editOpsPct, setEditOpsPct] = useState(8);
  const [editReason, setEditReason] = useState('');
  const [saving, setSaving] = useState(false);

  const openEditor = (client: any) => {
    setEditingClient(client);
    setEditSetupFee(client.setupFee);
    setEditRecoveryPct(client.recoveryPct);
    setEditOpsPct(client.operationsPct);
    setEditReason('');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateClientFees({
      companyId: editingClient.id,
      setupFee: editSetupFee,
      recoveryPct: editRecoveryPct,
      operationsPct: editOpsPct,
      reason: editReason,
    });
    setSaving(false);
    setEditingClient(null);
  };

  // Live preview calculation
  const previewGross = 1000;
  const previewOps = previewGross * (editOpsPct / 100);
  const previewNet = previewGross - previewOps;
  const previewKollection = previewNet * (editRecoveryPct / 100);
  const previewClient = previewNet - previewKollection;

  return (
    <PageWrapper title="All Clients">
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['Company', 'Industry', 'Accounts', 'Setup Fee', 'Recovery %', 'Ops %', 'Infrastructure', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Link to={`/admin/clients/${c.id}`} className="text-foreground font-medium hover:text-primary transition-colors">{c.name}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{c.industry}</td>
                <td className="px-4 py-3 font-mono">{c.accounts}</td>
                <td className="px-4 py-3 font-mono">${c.setupFee.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono">{c.recoveryPct}%</td>
                <td className="px-4 py-3 font-mono">{c.operationsPct}%</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {c.infrastructure.twilio ? <CheckCircle className="w-3 h-3 text-status-green" /> : <XCircle className="w-3 h-3 text-destructive" />}
                    {c.infrastructure.stripe ? <CheckCircle className="w-3 h-3 text-status-green" /> : <XCircle className="w-3 h-3 text-destructive" />}
                    {c.infrastructure.vapi ? <CheckCircle className="w-3 h-3 text-status-green" /> : <XCircle className="w-3 h-3 text-destructive" />}
                  </div>
                </td>
                <td className="px-4 py-3"><StatusBadge variant={c.status === 'Active' ? 'green' : 'yellow'}>{c.status}</StatusBadge></td>
                <td className="px-4 py-3">
                  <NeonButton size="sm" onClick={() => openEditor(c)}>
                    <Pencil className="w-3 h-3" /> Edit Fees
                  </NeonButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fee Editor Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setEditingClient(null)} />
          <div className="relative bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-1">Edit Fee Structure</h3>
            <p className="text-xs text-primary font-mono mb-4">{editingClient.name}</p>

            <div className="bg-destructive/5 border border-destructive/15 rounded-md px-3 py-2 mb-5 text-[10px] text-muted-foreground">
              ⚠ These changes affect this client only. Platform defaults: ${PLATFORM_DEFAULTS.setupFee.toLocaleString()} setup · {PLATFORM_DEFAULTS.recoveryPct}% recovery · {PLATFORM_DEFAULTS.operationsPct}% ops
            </div>

            <div className="space-y-5">
              {/* Setup Fee */}
              <div>
                <label className="text-[11px] text-muted-foreground mb-1.5 block">Setup Fee</label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input type="number" value={editSetupFee} onChange={e => setEditSetupFee(Number(e.target.value))}
                    className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono focus:border-primary/30 outline-none" />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Platform default: ${PLATFORM_DEFAULTS.setupFee.toLocaleString()}</span>
                  <button onClick={() => setEditSetupFee(PLATFORM_DEFAULTS.setupFee)} className="text-[10px] text-primary hover:underline">Reset</button>
                </div>
              </div>

              {/* Recovery % */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-muted-foreground">Recovery Fee %</label>
                  <span className="font-mono text-sm text-foreground">{editRecoveryPct}%</span>
                </div>
                <Slider value={[editRecoveryPct]} onValueChange={v => setEditRecoveryPct(v[0])} min={0} max={70} step={1} className="w-full" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">Platform default: {PLATFORM_DEFAULTS.recoveryPct}%</span>
                  <button onClick={() => setEditRecoveryPct(PLATFORM_DEFAULTS.recoveryPct)} className="text-[10px] text-primary hover:underline">Reset</button>
                </div>
              </div>

              {/* Operations % */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] text-muted-foreground">Operations Coverage %</label>
                  <span className="font-mono text-sm text-foreground">{editOpsPct}%</span>
                </div>
                <Slider value={[editOpsPct]} onValueChange={v => setEditOpsPct(v[0])} min={0} max={20} step={1} className="w-full" />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">% of gross recovery for SMS/call/email costs</span>
                  <button onClick={() => setEditOpsPct(PLATFORM_DEFAULTS.operationsPct)} className="text-[10px] text-primary hover:underline">Reset</button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-muted border border-border rounded-md p-3">
                <p className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">LIVE PREVIEW — if $1,000 collected</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Operations deducted ({editOpsPct}%)</span><span className="font-mono text-foreground">-${previewOps.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Remaining after ops</span><span className="font-mono text-foreground">${previewNet.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Kollection {editRecoveryPct}%</span><span className="font-mono text-foreground">${previewKollection.toFixed(2)}</span></div>
                  <div className="flex justify-between border-t border-border pt-1.5"><span className="text-foreground font-medium">Client receives</span><span className="font-mono text-status-green">${previewClient.toFixed(2)}</span></div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Reason / Note (optional)</label>
                <input value={editReason} onChange={e => setEditReason(e.target.value)} placeholder="Internal note — not visible to client"
                  className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <NeonButton size="sm" onClick={() => setEditingClient(null)}>Cancel</NeonButton>
              <NeonButton size="sm" variant="solid" loading={saving} onClick={handleSave}>Save Fee Structure</NeonButton>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
