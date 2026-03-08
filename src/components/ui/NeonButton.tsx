import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'outline' | 'solid' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md';
}

const NeonButton = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = 'outline', loading, size = 'md', children, className = '', ...props }, ref) => {
  const base = 'font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2';
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2 text-sm';

  const variantClass = variant === 'solid'
    ? 'bg-neon text-white hover:bg-neon/90'
    : variant === 'ghost'
    ? 'text-muted-foreground hover:text-foreground hover:bg-raised'
    : 'border border-border text-foreground hover:bg-raised hover:border-muted-foreground/30';

  return (
    <button ref={ref} className={`${base} ${sizeClass} ${variantClass} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {children}
    </button>
  );
});

NeonButton.displayName = 'NeonButton';
export default NeonButton;
