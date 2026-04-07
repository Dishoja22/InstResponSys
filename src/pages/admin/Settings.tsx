import { Settings, Shield, Bell, Database, Mail, Globe, Lock, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useToastStore } from '../../store/useToastStore';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('General');
  const [emergencyEscalation, setEmergencyEscalation] = useState(true);
  const [aiTriage, setAiTriage] = useState(true);
  const [email, setEmail] = useState('admin-noreply@university.edu');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  const tabs = ['General', 'Security', 'Notifications', 'Audit Log'];

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1000));
    addToast({
      title: 'Settings Saved',
      message: 'System configurations have been updated successfully.',
      variant: 'success'
    });
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-120px)] mx-auto max-w-7xl">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-accent">
            <Settings size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Admin System Settings</h1>
            <p className="text-sm text-muted mt-0.5">Control global platform behavior and configuration.</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-accent to-accent-violet hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50"
        >
          <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = {
              General: Globe,
              Security: Shield,
              Notifications: Bell,
              'Audit Log': Database
            }[tab] || Globe;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all",
                  activeTab === tab 
                    ? "bg-accent text-white shadow-lg shadow-accent/20" 
                    : "text-muted hover:bg-glass hover:text-primary"
                )}
              >
                <Icon size={18} />
                {tab}
              </button>
            );
          })}
        </div>
        
        {/* Settings Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-elevated/10 rounded-2xl border border-glass-border overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
            {activeTab === 'General' && (
              <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <section className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <Globe size={16} className="text-accent" /> Platform Governance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-5 border-glass-border flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-primary">Emergency Escalation</span>
                        <p className="text-xs text-muted">Notify deans for all URGENT marked tickets.</p>
                      </div>
                      <button onClick={() => setEmergencyEscalation(!emergencyEscalation)} className={cn("w-12 h-6 rounded-full relative transition-all", emergencyEscalation ? "bg-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-glass-border")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", emergencyEscalation ? "right-1" : "left-1")} />
                      </button>
                    </div>
                    <div className="glass-card p-5 border-glass-border flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-primary">AI Auto-Triage</span>
                        <p className="text-xs text-muted">Use Gemini to suggest categories on submission.</p>
                      </div>
                      <button onClick={() => setAiTriage(!aiTriage)} className={cn("w-12 h-6 rounded-full relative transition-all", aiTriage ? "bg-accent shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "bg-glass-border")}>
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", aiTriage ? "right-1" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                    <Mail size={16} className="text-accent" /> System Email
                  </h3>
                  <div className="glass-card p-6 border-glass-border flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                       <label className="text-xs font-bold text-muted uppercase">Admin Reply Email</label>
                       <input 
                        type="text" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-surface border border-glass-border rounded-xl py-3 px-4 text-sm text-primary outline-none focus:border-accent" 
                       />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'Security' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                  <Lock size={16} className="text-accent" /> Security Control
                </h3>
                <div className="glass-card p-6 border-glass-border text-center text-muted italic">
                  Advanced authentication and IP whitelist settings are currently in read-only mode for this prototype.
                </div>
              </div>
            )}

            {activeTab === 'Notifications' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                  <Bell size={16} className="text-accent" /> Global Alerts
                </h3>
                <div className="glass-card p-6 border-glass-border text-center text-muted italic">
                  Configure global SMS and Email alerts for staff members.
                </div>
              </div>
            )}

            {activeTab === 'Audit Log' && (
              <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                     <Database size={16} className="text-accent" /> System Audit Trail
                   </h3>
                   <button className="text-xs font-bold text-accent hover:underline">Export Logs</button>
                </div>
                <div className="glass-card border-glass-border overflow-hidden">
                  <table className="w-full text-left text-sm text-primary">
                    <thead className="bg-glass/50 text-muted text-[10px] uppercase font-bold tracking-widest">
                      <tr><th className="px-6 py-3">Event</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Timestamp</th></tr>
                    </thead>
                    <tbody className="divide-y divide-glass-border/20">
                      <tr><td className="px-6 py-4">Admin Config Change</td><td className="px-6 py-4">admin@university.edu</td><td className="px-6 py-4 text-xs font-mono">2024-03-25 10:42</td></tr>
                      <tr><td className="px-6 py-4">New Faculty Assigned</td><td className="px-6 py-4">system_auto</td><td className="px-6 py-4 text-xs font-mono">2024-03-25 09:12</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 p-6 border-t border-glass-border bg-elevated/30 flex justify-end gap-3 rounded-b-2xl">
            <button className="px-6 py-3 text-sm font-semibold text-muted hover:text-primary transition-colors">Discard</button>
            <button 
              onClick={handleSave}
              className="bg-accent hover:bg-accent-violet text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-accent/20 transition-all hover:-translate-y-0.5"
            >
              Update Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
