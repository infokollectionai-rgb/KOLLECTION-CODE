import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'solid';
  loading?: boolean;
  size?: 'sm' | 'md';
}

export default function NeonButton({ variant = 'outline', loading, size = 'md', children, className = '', ...props }: NeonButtonProps) {
  const base = 'font-body font-bold rounded-md tracking-[1px] uppercase transition-all cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-[10px]' : 'px-6 py-2.5 text-[12px]';

  const variantClass = variant === 'solid'
    ? 'bg-neon border border-neon text-primary-foreground neon-glow-md hover:bg-neon-bright hover:shadow-[0_0_30px_rgba(0,200,255,0.6)]'
    : 'bg-transparent border border-neon text-neon neon-text-glow neon-glow-sm hover:bg-neon/10 hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]';

  return (
    <button className={`${base} ${sizeClass} ${variantClass} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {children}
    </button>
  );
}
