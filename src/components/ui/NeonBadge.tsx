interface NeonBadgeProps {
  variant: 'green' | 'yellow' | 'red' | 'neon';
  children: React.ReactNode;
}

const styles = {
  green: 'bg-status-green/10 text-status-green border-status-green/25',
  yellow: 'bg-status-yellow/10 text-status-yellow border-status-yellow/25',
  red: 'bg-status-red/10 text-status-red border-status-red/25',
  neon: 'bg-neon/10 text-neon border-neon/30',
};

export default function NeonBadge({ variant, children }: NeonBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-[1.5px] uppercase border ${styles[variant]}`}>
      {children}
    </span>
  );
}
