import PageWrapper from '@/components/layout/PageWrapper';
import StatusBadge from '@/components/ui/NeonBadge';
import { mockClients } from '@/data/mockData';

export default function AdminClients() {
  return (
    <PageWrapper title="Client Management">
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Company', 'Industry', 'Accounts', 'Total Debt', 'Recovered', 'Setup Fee', 'Status'].map(h => (
                <th key={h} className="px-5 py-2.5 text-left text-[11px] text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-raised/50 transition-colors">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.id}</td>
                <td className="px-5 py-3 text-foreground font-medium">{c.name}</td>
                <td className="px-5 py-3 text-muted-foreground">{c.industry}</td>
                <td className="px-5 py-3 font-mono">{c.accounts}</td>
                <td className="px-5 py-3 font-mono">${c.totalDebt.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-status-green">${c.recovered.toLocaleString()}</td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">${c.setupFee} · {c.setupFeePaid}</td>
                <td className="px-5 py-3"><StatusBadge variant={c.status === 'Active' ? 'green' : 'yellow'}>{c.status}</StatusBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
