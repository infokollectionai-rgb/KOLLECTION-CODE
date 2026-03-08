import { useAuth } from '@/context/AuthContext';
import { Bell, User } from 'lucide-react';

export default function TopHeader() {
  const { role, setRole, companyName } = useAuth();

  return (
    <header className="h-14 bg-panel border-b border-border flex items-center justify-between px-4 md:px-6 fixed top-0 left-[60px] md:left-[220px] right-0 z-40">
      <div className="flex items-center gap-3">
        <span className="text-sm text-foreground font-medium">{companyName}</span>
        <div className="hidden sm:flex items-center gap-1.5 ml-2">
          <span className="w-1.5 h-1.5 rounded-full bg-status-green" />
          <span className="text-[10px] font-mono text-muted-foreground">AI Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Demo role switcher */}
        <div className="flex rounded-md overflow-hidden border border-border text-xs">
          <button
            onClick={() => setRole('user')}
            className={`px-2.5 py-1 transition-colors ${role === 'user' ? 'bg-neon/10 text-neon' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Client
          </button>
          <button
            onClick={() => setRole('admin')}
            className={`px-2.5 py-1 transition-colors ${role === 'admin' ? 'bg-status-red/10 text-status-red' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Admin
          </button>
        </div>

        <button className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="w-7 h-7 rounded-full bg-raised border border-border flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
