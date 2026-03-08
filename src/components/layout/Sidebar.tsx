import { useAuth } from '@/context/AuthContext';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, Users, MessageSquare, CreditCard, Target, BarChart3, 
  UserCheck, Settings, Receipt, Building2, DollarSign, Cpu, Shield,
  ChevronLeft, ChevronRight, Menu, X, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';

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
  { path: '/admin/applications', label: 'Applications', icon: FileText, badge: 2 },
  { path: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { path: '/admin/ai-performance', label: 'AI Performance', icon: Cpu },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = isAdmin ? adminNav : userNav;

  // Auto-collapse on mobile
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sidebarWidth = collapsed && !mobileOpen ? 'w-[60px]' : 'w-[240px]';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => { setMobileOpen(!mobileOpen); setCollapsed(false); }}
        className="fixed top-4 left-4 z-[60] md:hidden w-8 h-8 rounded-md bg-deep border border-border flex items-center justify-center text-neon"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      <aside className={`fixed top-0 left-0 z-50 h-screen bg-deep border-r border-border flex flex-col transition-all duration-300 ${sidebarWidth} ${
        mobileOpen ? 'translate-x-0' : collapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-border gap-2">
          <div className="w-8 h-8 rounded-md bg-neon/20 flex items-center justify-center neon-glow-sm flex-shrink-0">
            <Shield className="w-4 h-4 text-neon" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-display font-bold text-sm text-neon neon-text-glow tracking-widest">
              KOLLECTION
            </span>
          )}
        </div>

        {/* Admin Badge */}
        {isAdmin && (!collapsed || mobileOpen) && (
          <div className="mx-4 mt-3 px-2 py-1 rounded text-[10px] font-mono tracking-widest text-status-red bg-status-red/10 border border-status-red/25 text-center uppercase">
            Admin Mode
          </div>
        )}
        {isAdmin && collapsed && !mobileOpen && (
          <div className="mx-2 mt-3 w-8 h-1 rounded bg-status-red mx-auto" />
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = location.pathname === item.path;
            const showLabel = !collapsed || mobileOpen;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 py-3 text-[13px] font-semibold tracking-wide transition-all border-l-[3px] ${
                  showLabel ? 'px-5' : 'px-0 justify-center'
                } ${
                  active 
                    ? 'bg-neon/10 text-neon border-l-neon neon-text-glow' 
                    : 'text-muted-foreground border-l-transparent hover:bg-neon/5 hover:text-foreground'
                }`}
                title={!showLabel ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {showLabel && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-10 items-center justify-center border-t border-border text-muted-foreground hover:text-neon transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
