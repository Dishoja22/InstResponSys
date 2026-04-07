import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';
import { cn } from '../../lib/utils';
import { supabase, subscribeToAllComplaints } from '../../lib/supabase';

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    byCategory: [] as any[],
    byStatus: [] as any[],
    recentTrend: [] as any[]
  });

  useEffect(() => {
    fetchStats();
    
    // Point 16: Real-time subscription
    const sub = subscribeToAllComplaints(() => {
      fetchStats();
    });

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchStats = async () => {
    const { data: complaints, error } = await supabase.from('complaints').select('*');
    if (error || !complaints) return;

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    // Group by category
    const catMap: Record<string, number> = {};
    complaints.forEach(c => {
      catMap[c.category] = (catMap[c.category] || 0) + 1;
    });
    const byCategory = Object.entries(catMap).map(([name, val]) => ({ name, val }));

    // Real trend calculation (Last 7 Days Only)
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap: Record<string, {name: string, sub: number, res: number, date: number}> = {};
    
    // Initialize last 7 days in order
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayName = days[d.getDay()];
      const key = d.toISOString().split('T')[0];
      trendMap[key] = { name: dayName, sub: 0, res: 0, date: d.getTime() };
    }

    complaints.forEach(c => {
      const d = new Date(c.created_at);
      const key = d.toISOString().split('T')[0];
      if (trendMap[key]) {
        trendMap[key].sub += 1;
        if (c.status === 'Resolved' || c.status === 'Closed') {
          trendMap[key].res += 1;
        }
      }
    });
    const recentTrend = Object.values(trendMap).sort((a, b) => a.date - b.date);

    // AI Accuracy Calculation
    const withAI = complaints.filter(c => c.ai_priority);
    const correct = withAI.filter(c => c.ai_priority === c.priority).length;
    const accuracyRate = withAI.length ? Math.round((correct / withAI.length) * 100) : 100;

    const aiData = [
      { name: 'Correct', value: accuracyRate, color: '#10B981' },
      { name: 'Overridden', value: 100 - accuracyRate, color: '#F59E0B' },
    ];

    setStats({ total, pending, resolved, byCategory, byStatus: aiData, recentTrend });
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] mx-auto max-w-7xl overflow-hidden">
      
      <div className="flex items-center justify-between shrink-0 mb-2">
        <h1 className="text-2xl font-bold text-primary">Analytics Overview</h1>
        <div className="text-xs text-muted font-medium bg-glass px-3 py-1.5 rounded-lg border border-glass-border">
          REAL-TIME DATA SYNCED
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto custom-scrollbar pb-6 pr-2">
        
        {/* Main Trend */}
        <div className="glass-card p-5 flex flex-col min-h-[300px] md:col-span-2">
          <h3 className="font-bold text-xs text-muted uppercase tracking-wider mb-6">Complaint Velocity (Weekly)</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.recentTrend} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{backgroundColor: '#141428', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px'}} />
                <Line type="monotone" dataKey="sub" name="Submitted" stroke="var(--accent)" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: 'var(--accent)'}} animationDuration={2000} />
                <Line type="monotone" dataKey="res" name="Resolved" stroke="var(--accent-green)" strokeWidth={3} dot={{r: 4, strokeWidth: 0, fill: 'var(--accent-green)'}} animationDuration={2000} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Accuracy */}
        <div className="glass-card p-5 flex flex-col min-h-[300px]">
          <h3 className="font-bold text-xs text-muted uppercase tracking-wider mb-2 text-center">AI Triage Accuracy</h3>
          <div className="flex-1 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none" animationDuration={1500}>
                  {stats.byStatus.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#141428', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-mono font-bold text-primary">
                {stats.byStatus.length > 0 ? stats.byStatus[0].value : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid 1 */}
        <div className="glass-card p-5 flex flex-col min-h-[250px]">
          <h3 className="font-bold text-xs text-muted uppercase tracking-wider mb-6">Distribution by Category</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCategory} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#141428', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px'}} />
                <Bar dataKey="val" fill="var(--accent)" radius={[4, 4, 0, 0]} barSize={24} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="md:col-span-2 grid grid-cols-3 gap-4">
           {[
             { label: 'Total Volume', val: stats.total, color: 'text-primary' },
             { label: 'Active Pending', val: stats.pending, color: 'text-accent-amber' },
             { label: 'Resolution Rate', val: stats.total ? Math.round((stats.resolved / stats.total) * 100) + '%' : '0%', color: 'text-accent-green' },
           ].map(s => (
             <div key={s.label} className="glass-card p-6 flex flex-col items-center justify-center text-center gap-1">
                <span className={cn("text-4xl font-mono font-bold", s.color)}>{s.val}</span>
                <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{s.label}</span>
             </div>
           ))}
        </div>

      </div>
    </div>
  );
}
