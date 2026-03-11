import { useAuth } from '@/context/AuthContext';
import { Bell } from 'lucide-react';

export default function TopHeader() {
  const { profile } = useAuth();

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 md:px-6 fixed top-0 left-[60px] md:left-[220px] right-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground font-medium">{user?.company || 'Kollection'}</span>
        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--status-green))]" />
          <span className="text-[10px] font-mono text-muted-foreground">AI Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
