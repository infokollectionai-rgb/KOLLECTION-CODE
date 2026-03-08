import { useAuth } from '@/context/AuthContext';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, MessageSquare, Activity, CreditCard, FileText, Receipt,
  Settings, Building2, DollarSign, Shield, ChevronLeft, ChevronRight,
  Menu, X, ClipboardList, LogOut, User
} from 'lucide-react';
import { useState, useEffect } from 'react';

const userNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/accounts', label: 'Accounts', icon: Users },
  { path: '/dashboard/conversations', label: 'Conversations', icon: MessageSquare, badge: 3 },
  { path: '/dashboard/installments', label: 'Installment Plans', icon: CreditCard },
  { path: '/dashboard/reports', label: 'Reports', icon: FileText },
  { path: '/dashboard/billing', label: 'Billing', icon: Receipt },
  { path: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const adminNav = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/clients', label: 'All Clients', icon: Building2 },
  { path: '/admin/conversations', label: 'Conversations', icon: MessageSquare, badge: 12 },
  { path: '/admin/applications', label: 'Applications', icon: ClipboardList, badge: 2 },
  { path: '/admin/revenue', label: 'Billing & Payouts', icon: DollarSign },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = isAdmin ? adminNav : userNav;

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

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sidebarWidth = collapsed && !mobileOpen ? 'w-[60px]' : 'w-[220px]';

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <button
        onClick={() => { setMobileOpen(!mobileOpen); setCollapsed(false); }}
        className="fixed top-3.5 left-3.5 z-[60] md:hidden w-7 h-7 rounded bg-card border border-border flex items-center justify-center text-muted-foreground"
      >
        {mobileOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
      </button>

      <aside className={`fixed top-0 left-0 z-50 h-screen bg-card border-r border-border flex flex-col transition-all duration-200 ${sidebarWidth} ${
        mobileOpen ? 'translate-x-0' : collapsed ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border gap-2">
          <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-semibold text-sm text-foreground tracking-wide">Kollection</span>
          )}
        </div>

        {/* Role indicator */}
        {isAdmin && (!collapsed || mobileOpen) && (
          <div className="mx-3 mt-3 px-2 py-1 rounded text-[10px] font-mono text-destructive bg-destructive/8 border border-destructive/15 text-center">
            Admin
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const active = location.pathname === item.path;
            const showLabel = !collapsed || mobileOpen;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2.5 py-2 text-[13px] transition-colors border-l-2 ${
                  showLabel ? 'px-4' : 'px-0 justify-center'
                } ${
                  active
                    ? 'bg-primary/8 text-primary border-l-primary'
                    : 'text-muted-foreground border-l-transparent hover:bg-muted hover:text-foreground'
                }`}
                title={!showLabel ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {showLabel && <span className="flex-1">{item.label}</span>}
                {showLabel && 'badge' in item && (item as any).badge > 0 && (
                  <span className="bg-primary/15 text-primary text-[10px] font-mono px-1.5 py-0.5 rounded-full">
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info + logout */}
        {user && (!collapsed || mobileOpen) && (
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.company}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-9 items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>
    </>
  );
}
