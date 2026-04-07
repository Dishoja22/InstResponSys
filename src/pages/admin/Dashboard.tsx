import { useState, useEffect, useMemo } from 'react';
import { Inbox, Clock, CheckCircle, Timer, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { ComplaintDrawer } from '../../components/ui/Drawer';
import { cn } from '../../lib/utils';
import { supabase, subscribeToAllComplaints } from '../../lib/supabase';

const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [end, duration]); // Point 17: Fixed dependency array
  return count;
};

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    resolvedRate: 0,
    avgTime: 0
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
    
    // Real-time subscription
    const sub = subscribeToAllComplaints(() => {
      fetchData();
    });

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('complaints')
      .select('*, submitted_by:users(full_name, email), assigned_officer:users!complaints_assigned_officer_fkey(full_name), assigned_department:departments(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('SUPABASE ERROR:', error.message, error.details);
      return;
    }

    if (data) {
      setComplaints(data);
      
      const total = data.length;
      const pending = data.filter(c => c.status === 'Pending').length;
      const resolved = data.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const rate = total ? Math.round((resolved / total) * 100) : 0;
      
      // Calculate avg time (Placeholder improved)
      const resolvedItems = data.filter(c => c.resolved_at && c.created_at);
      const avgDays = resolvedItems.length > 0 
        ? resolvedItems.reduce((acc, c) => acc + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()), 0) / resolvedItems.length / (1000 * 60 * 60 * 24)
        : 2.4;

      setMetrics({
        total,
        pending,
        resolvedRate: rate,
        avgTime: parseFloat(avgDays.toFixed(1))
      });
    }
  };

  const filteredLive = useMemo(() => {
    return complaints
      .filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.complaint_code.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10);
  }, [complaints, search]);

  const catData = useMemo(() => {
    const counts: Record<string, number> = {};
    complaints.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, val]) => ({ name, val }));
  }, [complaints]);

  const statusData = useMemo(() => {
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const progress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    return [
      { name: 'Pending', value: pending, color: '#F59E0B' },
      { name: 'In Progress', value: progress, color: '#3B82F6' },
      { name: 'Resolved', value: resolved, color: '#10B981' },
    ];
  }, [complaints]);

  const countTotal = useCountUp(metrics.total, 1500);
  const countPending = useCountUp(metrics.pending, 1500);
  const countRate = useCountUp(metrics.resolvedRate, 1500);
  const countTime = useCountUp(metrics.avgTime * 10, 1500);

  const handleOpenDrawer = (complaint: any) => {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] mx-auto max-w-7xl">
      
      {/* Row 1 - Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[88px] shrink-0">
        <div className="glass-card flex items-center justify-between p-4 relative overflow-hidden group">
          <div className="flex flex-col z-10">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total</span>
            <span className="text-2xl font-mono font-bold text-primary mt-1">{countTotal}</span>
            <span className="text-[10px] text-accent-green mt-1">Live data</span>
          </div>
          <Inbox className="text-muted/20 absolute right-[-10px] top-4 z-0 group-hover:scale-110 transition-transform" size={60} strokeWidth={1} />
        </div>
        
        <div className="glass-card flex items-center justify-between p-4 relative overflow-hidden group border-b-2 border-b-accent-amber bg-[rgba(245,158,11,0.02)]">
          <div className="flex flex-col z-10">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Pending</span>
            <span className="text-2xl font-mono font-bold text-accent-amber mt-1">{countPending}</span>
            <span className="text-[10px] text-accent-amber mt-1">Needs attention</span>
          </div>
          <Clock className="text-accent-amber/10 absolute right-[-10px] top-4 z-0 group-hover:scale-110 transition-transform" size={60} strokeWidth={1} />
        </div>

        <div className="glass-card flex items-center justify-between p-4 relative overflow-hidden group">
          <div className="flex flex-col z-10">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Resolution</span>
            <span className="text-2xl font-mono font-bold text-accent-green mt-1">{countRate}%</span>
            <span className="text-[10px] text-muted mt-1">Overall rate</span>
          </div>
          <CheckCircle className="text-accent-green/10 absolute right-[-10px] top-4 z-0 group-hover:scale-110 transition-transform" size={60} strokeWidth={1} />
        </div>

        <div className="glass-card flex items-center justify-between p-4 relative overflow-hidden group">
          <div className="flex flex-col z-10">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Time</span>
            <span className="text-2xl font-mono font-bold text-accent-blue mt-1">{(countTime/10).toFixed(1)}d</span>
            <span className="text-[10px] text-muted mt-1">Resolution avg</span>
          </div>
          <Timer className="text-accent-blue/10 absolute right-[-10px] top-4 z-0 group-hover:scale-110 transition-transform" size={60} strokeWidth={1} />
        </div>
      </div>

      {/* Row 2 - Main */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-[300px] overflow-hidden">
        {/* Left: Table */}
        <div className="w-full md:w-[55%] glass-card flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b border-glass-border flex justify-between items-center bg-elevated/50 shrink-0">
             <div className="flex items-center gap-2">
               <h3 className="font-bold text-primary">Live Complaints</h3>
               <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             </div>
             <div className="flex gap-2">
                <input 
                  placeholder="Search by ID or title..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-surface border border-border rounded px-3 py-1 text-sm text-primary outline-none w-48 focus:border-accent" 
                />
             </div>
          </div>
          
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
              <thead className="sticky top-0 bg-elevated/80 backdrop-blur border-b border-glass-border text-muted text-xs uppercase z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-4 font-semibold">Priority</th>
                  <th className="px-4 py-4 font-semibold">Assigned To</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-primary divide-y divide-glass-border/40">
                {filteredLive.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">No complaints found.</td>
                  </tr>
                ) : (
                  filteredLive.map(r => (
                    <tr key={r.id} className={cn("hover:bg-glass/50 transition-colors group", r.priority === 'URGENT' && 'bg-accent-red/5 hover:bg-accent-red/10')}>
                      <td className="px-4 py-3 font-mono text-xs text-muted font-bold group-hover:text-primary transition-colors">{r.complaint_code}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-primary truncate max-w-[200px]" title={r.title}>{r.title}</div>
                        <div className="text-[10px] text-muted">{r.category} · {new Date(r.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4"><PriorityBadge priority={r.priority} /></td>
                      <td className="px-4 py-4 text-xs font-medium text-muted">{r.assigned_officer?.full_name || '-'}</td>
                      <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-3 text-right">
                         <button onClick={() => handleOpenDrawer(r)} className="p-1.5 rounded bg-surface hover:bg-accent/20 hover:text-accent text-muted transition-colors border border-border">
                           <Eye size={16}/>
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Charts */}
        <div className="w-full md:w-[45%] flex flex-col gap-4">
          <div className="glass-card flex-1 p-4 flex flex-col">
            <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-2">Category Volume</h3>
            <div className="flex-1 w-full min-h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} width={80} />
                  <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{backgroundColor: '#141428', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px'}} />
                  <Bar dataKey="val" fill="var(--accent-violet)" radius={[0, 4, 4, 0]} barSize={12} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="glass-card flex-1 p-4 flex flex-col">
            <h3 className="font-bold text-sm text-muted uppercase tracking-wider">Status Distribution</h3>
             <div className="flex-1 w-full flex items-center justify-center min-h-[120px] relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={statusData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={2} dataKey="value" stroke="none" animationDuration={1500}>
                     {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                   </Pie>
                   <RechartsTooltip contentStyle={{backgroundColor: '#141428', border: '1px solid rgba(99,102,241,0.12)', borderRadius: '8px', fontSize: '12px'}} />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>
      
      {/* Drawer */}
      <ComplaintDrawer 
        isOpen={drawerOpen} 
        onClose={() => { setDrawerOpen(false); setSelectedComplaint(null); }} 
        isAdmin 
        complaint={selectedComplaint}
        onUpdate={fetchData}
      />
    </div>
  );
}
