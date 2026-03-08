import { useAuth } from '@/context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, CreditCard, Target, BarChart3, 
  UserCheck, Settings, Receipt, Building2, DollarSign, Cpu, Shield,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const userNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/accounts', label: 'Accounts', icon: Users },
  { path: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare },
  { path: '/dashboard/installments', label: 'Installments', icon: CreditCard },
  { path: '/dashboard/promises', label: 'Promises', icon: Target },
  { path: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/dashboard/takeover', label: 'Human Takeover', icon: UserCheck },
  { path: '/dashboard/billing', label: 'Billing', icon: Receipt },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/clients', label: 'Clients', icon: Building2 },
  { path: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { path: '/admin/ai-performance', label: 'AI Performance', icon: Cpu },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const nav = isAdmin ? adminNav : userNav;

  return (
    <aside className={`fixed top-0 left-0 z-50 h-screen bg-deep border-r border-border flex flex-col transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[240px]'}`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border gap-2">
        <div className="w-8 h-8 rounded-md bg-neon/20 flex items-center justify-center neon-glow-sm flex-shrink-0">
          <Shield className="w-4 h-4 text-neon" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-sm text-neon neon-text-glow tracking-widest">
            KOLLECTION
          </span>
        )}
      </div>

      {/* Admin Badge */}
      {isAdmin && !collapsed && (
        <div className="mx-4 mt-3 px-2 py-1 rounded text-[10px] font-mono tracking-widest text-status-red bg-status-red/10 border border-status-red/25 text-center uppercase">
          Admin Mode
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-5 py-3 text-[13px] font-semibold tracking-wide transition-all border-l-[3px] ${
                active 
                  ? 'bg-neon/10 text-neon border-l-neon neon-text-glow' 
                  : 'text-muted-foreground border-l-transparent hover:bg-neon/5 hover:text-foreground'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center border-t border-border text-muted-foreground hover:text-neon transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
