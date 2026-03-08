interface BadgeProps {
  variant: 'green' | 'yellow' | 'red' | 'blue' | 'neutral';
  children: React.ReactNode;
}

const styles = {
  green: 'bg-status-green/10 text-status-green',
  yellow: 'bg-status-yellow/10 text-status-yellow',
  red: 'bg-status-red/10 text-status-red',
  blue: 'bg-neon/10 text-neon',
  neutral: 'bg-muted text-muted-foreground',
};

export default function StatusBadge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide ${styles[variant]}`}>
      {children}
    </span>
  );
}
