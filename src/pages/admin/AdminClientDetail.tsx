import { useParams, Link } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper';
import KpiCard from '@/components/ui/KpiCard';
import StatusBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockClients, mockFeeHistory, mockDebtors } from '@/data/mockData';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminClientDetail() {
  const { id } = useParams<{ id: string }>();
  const client = mockClients.find(c => c.id === id);

  if (!client) {
    return (
      <PageWrapper title="Client Not Found">
        <Link to="/admin/clients" className="text-primary hover:underline text-sm flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Back to Clients
        </Link>
      </PageWrapper>
    );
  }

  const clientDebtors = mockDebtors.filter(d => d.company === client.name);
  const clientFeeChanges = mockFeeHistory.filter(f => f.company === client.name);

  const InfraItem = ({ label, ok }: { label: string; ok: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-border/50">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {ok ? <CheckCircle className="w-3.5 h-3.5 text-status-green" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
        <span className={`text-xs font-mono ${ok ? 'text-status-green' : 'text-destructive'}`}>{ok ? 'Connected' : 'Not Connected'}</span>
      </div>
    </div>
  );

  return (
    <PageWrapper title={client.name}>
      <Link to="/admin/clients" className="text-primary hover:underline text-xs flex items-center gap-1 mb-5">
        <ArrowLeft className="w-3 h-3" /> Back to All Clients
      </Link>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Accounts" value={client.accounts.toString()} />
        <KpiCard label="Monthly Recovered" value={`$${client.monthlyRecovered.toLocaleString()}`} accent="green" />
        <KpiCard label="Setup Fee" value={`$${client.setupFee.toLocaleString()}`} />
        <KpiCard label="Recovery Rate" value={`${client.recoveryPct}%`} accent="neon" />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="notes">Fee History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-xs text-muted-foreground mb-3">Company Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="text-foreground">{client.industry}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge variant={client.status === 'Active' ? 'green' : 'yellow'}>{client.status}</StatusBadge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-mono text-foreground">{client.twilioPhone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">AI Agent</span><span className="text-foreground">{client.vapiAgent || '—'}</span></div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-xs text-muted-foreground mb-3">Fee Structure</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Setup Fee</span><span className="font-mono text-foreground">${client.setupFee.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Recovery Fee</span><span className="font-mono text-foreground">{client.recoveryPct}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Operations %</span><span className="font-mono text-foreground">{client.operationsPct}%</span></div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="accounts">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Balance', 'Recovered', 'Tier', 'Status', 'Days Overdue'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientDebtors.map(d => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-foreground">{d.name}</td>
                    <td className="px-4 py-3 font-mono">${d.balance.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-status-green">${d.recovered.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono">{d.tier}</td>
                    <td className="px-4 py-3"><StatusBadge variant={d.status === 'Paid' ? 'green' : d.status === 'Active' ? 'blue' : d.status === 'Manual' || d.status === 'Escalated' ? 'red' : 'yellow'}>{d.status}</StatusBadge></td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{d.daysOverdue}</td>
                  </tr>
                ))}
                {clientDebtors.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No accounts yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="infrastructure">
          <div className="bg-card border border-border rounded-lg p-5 max-w-md">
            <h3 className="text-xs text-muted-foreground mb-3">Service Status</h3>
            <InfraItem label="Twilio (SMS + Calls)" ok={client.infrastructure.twilio} />
            <InfraItem label="Stripe (Payments)" ok={client.infrastructure.stripe} />
            <InfraItem label="VAPI (AI Voice)" ok={client.infrastructure.vapi} />
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Field', 'Old Value', 'New Value', 'Reason', 'Changed By'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientFeeChanges.map((f, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.date}</td>
                    <td className="px-4 py-3 text-foreground">{f.field}</td>
                    <td className="px-4 py-3 font-mono">{f.oldValue}</td>
                    <td className="px-4 py-3 font-mono text-primary">{f.newValue}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{f.reason}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.changedBy}</td>
                  </tr>
                ))}
                {clientFeeChanges.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No fee changes recorded</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrapper>
  );
}
