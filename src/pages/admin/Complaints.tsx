import { useState, useEffect } from 'react';
import { Filter, Download, Eye, ArrowUpDown } from 'lucide-react';
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge';
import { ComplaintDrawer } from '../../components/ui/Drawer';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToastStore(s => s.addToast);
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'priority'>('newest');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error:', error);
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const departments = Array.from(new Set(complaints.map(c => c.category).filter(Boolean)));
  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  const filteredComplaints = complaints
    .filter(c => (statusFilter === 'All' || c.status === statusFilter))
    .filter(c => (priorityFilter === 'All' || c.priority === priorityFilter))
    .filter(c => (deptFilter === 'All' || c.category === deptFilter))
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order: Record<string, number> = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        return (order[a.priority] ?? 99) - (order[b.priority] ?? 99);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const handleOpenDrawer = (complaint: any) => {
    setSelectedComplaint(complaint);
    setDrawerOpen(true);
  };

  const exportToCSV = () => {
    if (filteredComplaints.length === 0) return;
    
    const headers = ['Code', 'Title', 'Category', 'Priority', 'Status', 'Submitted By', 'Date'];
    const csvData = filteredComplaints.map(c => [
      c.complaint_code,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      c.submitted_by?.full_name || 'Unknown',
      new Date(c.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `complaints_export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredComplaints.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredComplaints.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkAction = (action: string) => {
    addToast({
      title: `Bulk ${action} Initiated`,
      message: `Processing ${selectedIds.length} complaints for bulk ${action.toLowerCase()}.`,
      variant: 'info'
    });
    // In a real app, we'd call a Supabase function here
    setSelectedIds([]);
  };

  return (
    <div className="flex flex-col gap-4 w-full h-[calc(100vh-120px)] mx-auto max-w-7xl">
      
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Complaint Management</h1>
            <p className="text-sm text-muted mt-0.5">Review, triage, and resolve incoming student issues.</p>
          </div>
          
          {/* Bulk Actions Bar (Point 18) */}
          {selectedIds.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-accent/10 border border-accent/30 px-4 py-2 rounded-xl"
            >
              <span className="text-xs font-bold text-accent">{selectedIds.length} selected</span>
              <div className="h-4 w-[1px] bg-accent/30 mx-1" />
              <button 
                onClick={() => handleBulkAction('Assign')}
                className="text-xs font-bold text-primary hover:text-accent transition-colors"
              >
                Bulk Assign
              </button>
              <button 
                onClick={() => handleBulkAction('Close')}
                className="text-xs font-bold text-primary hover:text-accent transition-colors"
              >
                Bulk Close
              </button>
            </motion.div>
          )}

          <div className="flex items-center gap-3">
           <button 
             onClick={() => setSortBy(sortBy === 'newest' ? 'priority' : 'newest')}
             className="glass-card px-4 py-2 font-semibold text-sm flex items-center gap-2 hover:bg-glass text-muted hover:text-primary transition-all"
           >
             <ArrowUpDown size={16} /> Sort: {sortBy === 'newest' ? 'Newest' : 'Priority'}
           </button>
           <button onClick={() => setShowFilters(!showFilters)} className={cn("glass-card px-4 py-2 font-semibold text-sm flex items-center gap-2 transition-all", showFilters ? "bg-accent/20 border-accent text-primary" : "text-muted hover:text-primary")}>
             <Filter size={16} /> Filters
           </button>
           <button onClick={exportToCSV} className="glass-card px-4 py-2 font-semibold text-sm flex items-center gap-2 hover:bg-glass text-muted hover:text-primary transition-all">
             <Download size={16} /> Export CSV
           </button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden z-10 shrink-0">
             <div className="bg-elevated border border-border rounded-xl p-4 flex flex-wrap gap-4 mt-1 shadow-xl">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Status</label>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-surface border border-glass-border rounded-lg px-3 py-2 text-sm outline-none w-full text-primary focus:border-accent transition-colors"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Priority</label>
                  <select 
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-surface border border-glass-border rounded-lg px-3 py-2 text-sm outline-none w-full text-primary focus:border-accent transition-colors"
                  >
                    <option value="All">All Priorities</option>
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                  <label className="text-xs font-bold text-muted uppercase tracking-wider">Department</label>
                  <select 
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-surface border border-glass-border rounded-lg px-3 py-2 text-sm outline-none w-full text-primary focus:border-accent transition-colors"
                  >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex items-end flex-none">
                  <button 
                    onClick={() => { setStatusFilter('All'); setPriorityFilter('All'); setDeptFilter('All'); }}
                    className="text-xs font-bold text-accent hover:text-accent-violet transition-colors mb-2.5 px-2"
                  >
                    Reset All
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Area */}
      <div className="glass-card flex-1 overflow-hidden flex flex-col p-0 border border-glass-border shadow-2xl relative">
          <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar relative bg-surface/30">
            <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
              <thead className="sticky top-0 bg-elevated/95 backdrop-blur-md border-b border-glass-border text-muted text-xs uppercase z-20 shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold w-10">
                    <input 
                      type="checkbox" 
                      className="rounded border-glass-border bg-surface cursor-pointer"
                      checked={selectedIds.length === filteredComplaints.length && filteredComplaints.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 font-semibold">Code</th>
                  <th className="px-4 py-4 font-semibold">Title</th>
                  <th className="px-4 py-4 font-semibold">Submitted By</th>
                  <th className="px-4 py-4 font-semibold">Priority</th>
                  <th className="px-4 py-4 font-semibold">Assigned To</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border/40 text-primary">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                       <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-muted font-medium italic">
                      No complaints found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredComplaints.map((r) => (
                    <tr key={r.id} className={cn("hover:bg-glass/60 transition-colors group", r.priority === 'URGENT' && 'bg-accent-red/5 hover:bg-accent-red/10', selectedIds.includes(r.id) && 'bg-accent/10')}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-glass-border bg-surface outline-none cursor-pointer"
                          checked={selectedIds.includes(r.id)}
                          onChange={() => toggleSelect(r.id)}
                        />
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-muted font-bold group-hover:text-primary transition-colors">{r.complaint_code}</td>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-primary truncate max-w-[250px] mb-0.5">{r.title}</div>
                        <div className="text-[10px] text-muted">{r.category}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium">{r.submitted_by?.full_name || 'Anonymous'}</div>
                        <div className="text-[10px] text-muted">{r.submitted_by?.email}</div>
                      </td>
                      <td className="px-4 py-4"><PriorityBadge priority={r.priority} /></td>
                      <td className="px-4 py-4 text-xs font-medium text-muted">{r.assigned_officer?.full_name || '-'}</td>
                      <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                      <td className="px-4 py-4 text-xs text-muted font-medium">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                         <button onClick={() => handleOpenDrawer(r)} className="p-2 rounded-lg bg-surface group-hover:bg-accent/20 group-hover:text-accent text-muted transition-colors border border-border shadow-sm">
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

      <ComplaintDrawer 
        isOpen={drawerOpen} 
        onClose={() => { setDrawerOpen(false); setSelectedComplaint(null); }} 
        isAdmin 
        complaint={selectedComplaint}
        onUpdate={fetchComplaints}
      />
    </div>
  );
}
