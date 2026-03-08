interface KpiCardProps {
  label: string;
  value: string;
  accent?: 'neon' | 'green' | 'yellow' | 'red';
  subtext?: string;
}

export default function KpiCard({ label, value, accent, subtext }: KpiCardProps) {
  const accentBorder = accent === 'green' ? 'border-t-status-green' : accent === 'red' ? 'border-t-status-red' : accent === 'yellow' ? 'border-t-status-yellow' : accent === 'neon' ? 'border-t-neon' : 'border-t-transparent';

  return (
    <div className={`bg-panel border border-border ${accentBorder} border-t-2 rounded-lg p-5`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-mono text-xl font-medium text-foreground">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </div>
  );
}
