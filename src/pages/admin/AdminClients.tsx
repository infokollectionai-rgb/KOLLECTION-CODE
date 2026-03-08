import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import { mockClients } from '@/data/mockData';

export default function AdminClients() {
  return (
    <PageWrapper title="Client Management">
      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Company', 'Industry', 'Accounts', 'Total Debt', 'Recovered', 'Plan', 'Status'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockClients.map(c => (
              <tr key={c.id} className="border-b border-border/30 hover:bg-neon/5 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-mono text-muted-foreground">{c.id}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.industry}</td>
                <td className="px-4 py-3 font-mono">{c.accounts}</td>
                <td className="px-4 py-3 font-mono text-neon">${c.totalDebt.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-status-green">${c.recovered.toLocaleString()}</td>
                <td className="px-4 py-3"><NeonBadge variant="neon">{c.plan}</NeonBadge></td>
                <td className="px-4 py-3"><NeonBadge variant={c.status === 'Active' ? 'green' : 'yellow'}>{c.status}</NeonBadge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
