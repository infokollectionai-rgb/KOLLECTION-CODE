import PageWrapper from '@/components/layout/PageWrapper';
import NeonButton from '@/components/ui/NeonButton';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Save } from 'lucide-react';

const tabs = ['Company Info', 'Notifications', 'Team Access', 'Billing', 'Security'];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Company Info');

  return (
    <PageWrapper title="Settings">
      <div className="flex gap-6 min-h-[calc(100vh-160px)]">
        <div className="w-[180px] space-y-1 flex-shrink-0">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                activeTab === tab ? 'bg-primary/10 text-primary border border-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
              }`}>{tab}</button>
          ))}
        </div>

        <div className="flex-1 bg-card border border-border rounded-lg p-6">
          {activeTab === 'Company Info' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Company Profile</h3>
                <p className="text-xs text-muted-foreground">Update your company information.</p>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Company Name</label>
                <input defaultValue={profile?.company_name || ''} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Business Address</label>
                <input defaultValue="123 Main St, Montreal, QC" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Primary Contact</label>
                <input defaultValue={profile?.contact_name || ''} className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
              <NeonButton variant="solid" size="sm"><Save className="w-3 h-3" /> Save Changes</NeonButton>
            </div>
          )}

          {activeTab === 'Notifications' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Notification Preferences</h3>
                <p className="text-xs text-muted-foreground">Manage email alerts and updates.</p>
              </div>
              {['Payout notifications', 'Account status updates', 'Weekly recovery summary', 'New account imported'].map(item => (
                <label key={item} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item}</span>
                  <input type="checkbox" defaultChecked className="accent-[hsl(205,100%,50%)]" />
                </label>
              ))}
              <NeonButton variant="solid" size="sm"><Save className="w-3 h-3" /> Save Preferences</NeonButton>
            </div>
          )}

          {activeTab === 'Team Access' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Team Members</h3>
                <p className="text-xs text-muted-foreground">Manage who has access to your dashboard.</p>
              </div>
              <div className="bg-muted border border-border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <span className="text-[10px] font-mono text-primary">Manager</span>
                </div>
              </div>
              <NeonButton size="sm">+ Invite Team Member</NeonButton>
            </div>
          )}

          {activeTab === 'Billing' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Payout Settings</h3>
                <p className="text-xs text-muted-foreground">Your payouts are transferred automatically on the 1st of every month via Stripe.</p>
              </div>
              <div className="bg-muted border border-border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Payout Schedule</p>
                    <p className="text-sm text-foreground font-medium">Monthly — 1st of every month</p>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">Fixed policy</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Payment Method</label>
                <p className="text-sm text-foreground">Stripe Connect — <span className="text-status-green text-xs">Connected</span></p>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="space-y-5 max-w-lg">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Security Settings</h3>
                <p className="text-xs text-muted-foreground">Manage your password and security options.</p>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Current Password</label>
                <input type="password" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">New Password</label>
                <input type="password" className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground focus:border-primary/30 outline-none" />
              </div>
              <NeonButton variant="solid" size="sm"><Save className="w-3 h-3" /> Update Password</NeonButton>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
