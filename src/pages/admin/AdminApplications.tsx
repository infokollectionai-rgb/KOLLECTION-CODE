import PageWrapper from '@/components/layout/PageWrapper';
import NeonBadge from '@/components/ui/NeonBadge';
import NeonButton from '@/components/ui/NeonButton';
import { mockOnboardingApplications } from '@/data/mockData';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

const statusVariant = (s: string) => s === 'Approved' ? 'green' as const : s === 'Rejected' ? 'red' as const : 'yellow' as const;

export default function AdminApplications() {
  return (
    <PageWrapper title="Partner Applications">
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-panel border border-border rounded-xl p-5 border-t-2 border-t-status-yellow">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Pending</p>
          <p className="font-display text-2xl font-bold text-status-yellow mt-1">{mockOnboardingApplications.filter(a => a.status === 'Pending').length}</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-5 border-t-2 border-t-status-green">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Approved</p>
          <p className="font-display text-2xl font-bold text-status-green mt-1">{mockOnboardingApplications.filter(a => a.status === 'Approved').length}</p>
        </div>
        <div className="bg-panel border border-border rounded-xl p-5 border-t-2 border-t-status-red">
          <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Rejected</p>
          <p className="font-display text-2xl font-bold text-status-red mt-1">{mockOnboardingApplications.filter(a => a.status === 'Rejected').length}</p>
        </div>
      </div>

      <div className="bg-panel border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['ID', 'Company', 'Contact', 'Type', 'Avg Loan', 'Monthly Vol', 'Submitted', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-mono tracking-widest text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockOnboardingApplications.map(app => (
              <tr key={app.id} className="border-b border-border/30 hover:bg-neon/5 transition-colors">
                <td className="px-4 py-3 font-mono text-muted-foreground">{app.id}</td>
                <td className="px-4 py-3 text-foreground font-semibold">{app.company}</td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{app.contact}</p>
                  <p className="text-[10px] text-muted-foreground">{app.email}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{app.type}</td>
                <td className="px-4 py-3 font-mono text-neon text-xs">{app.avgLoan}</td>
                <td className="px-4 py-3 font-mono text-xs">{app.monthlyAccounts}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground text-xs">{app.submitted}</td>
                <td className="px-4 py-3"><NeonBadge variant={statusVariant(app.status)}>{app.status}</NeonBadge></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <NeonButton size="sm"><Eye className="w-3 h-3" /></NeonButton>
                    {app.status === 'Pending' && (
                      <>
                        <NeonButton size="sm" className="text-status-green border-status-green/30"><CheckCircle className="w-3 h-3" /></NeonButton>
                        <NeonButton size="sm" className="text-status-red border-status-red/30"><XCircle className="w-3 h-3" /></NeonButton>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
}
