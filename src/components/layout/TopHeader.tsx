import { useAuth } from '@/context/AuthContext';
import { Bell, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function TopHeader() {
  const { role, setRole, companyName } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-deep border-b border-border flex items-center justify-between px-4 md:px-8 fixed top-0 left-[60px] md:left-[240px] right-0 z-40">
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-[11px] font-mono tracking-widest text-muted-foreground uppercase">
          System Online
        </span>
        <span className="text-[11px] font-mono text-neon">— {companyName}</span>
        <span className="hidden md:inline text-[10px] font-mono text-muted-foreground/50">
          {time}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Role Switcher */}
        <div className="flex rounded-md overflow-hidden border border-border">
          <button
            onClick={() => setRole('user')}
            className={`px-2 md:px-3 py-1.5 text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-all ${
              role === 'user' 
                ? 'bg-neon/20 text-neon neon-text-glow' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            👤 User
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`px-2 md:px-3 py-1.5 text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-all ${
              role === 'admin' 
                ? 'bg-status-red/20 text-status-red' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🔐 Admin
          </button>
        </div>

        <button className="relative p-2 text-muted-foreground hover:text-neon transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-neon rounded-full animate-neon-pulse" />
        </button>

        <div className="w-8 h-8 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center">
          <User className="w-4 h-4 text-neon" />
        </div>
      </div>
    </header>
  );
}
