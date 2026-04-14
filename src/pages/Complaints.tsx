import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Bell, Home, BookOpen, Monitor, Library as LibraryIcon, Bus, Settings } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/Badge';
import { ComplaintDrawer } from '../components/ui/Drawer';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Hostel': <Home size={14} />,
  'Academic': <BookOpen size={14} />,
  'IT & Tech': <Monitor size={14} />,
  'IT': <Monitor size={14} />,
  'Library': <LibraryIcon size={14} />,
  'Transport': <Bus size={14} />,
  'Administration': <Settings size={14} />
};

const getTimelineStep = (status: string) => {
  switch(status) {
    case 'Pending': return 1;
    case 'In Progress': return 3;
    case 'Resolved': return 4;
    case 'Closed': return 4;
    default: return 1;
  }
};

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
  }, [end, duration]);
  return count;
};

// Mini Timeline Component
function MiniTimeline({ currentStep }: { currentStep: number }) {
  const steps = ['Submitted', 'Review', 'In Progress', 'Resolved'];
  return (
    <div className="flex items-center w-full max-w-sm mt-3 pt-3 border-t border-glass-border">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > idx + 1;
        const isCurrent = currentStep === idx + 1;
        return (
          <div key={step} className="flex-1 flex items-center group relative">
            <div className={cn("w-2 h-2 rounded-full z-10 shrink-0 transition-all", isCompleted ? "bg-accent-green" : isCurrent ? "bg-accent shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "bg-glass-border border border-muted")} />
            {isCurrent && <div className="absolute w-4 h-4 rounded-full bg-accent/30 animate-pulse -left-1 top-1/2 -translate-y-1/2" />}
            
            {idx < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-1 bg-glass-border relative overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                  className={cn("absolute inset-0", isCompleted ? "bg-accent-green" : "")} 
                />
              </div>
            )}
            
            {/* Tooltip */}
            <div className="absolute opacity-0 group-hover:opacity-100 -top-6 -translate-x-1/2 left-1 bg-elevated px-2 py-0.5 rounded text-[10px] text-muted whitespace-nowrap border border-border pointer-events-none transition-opacity z-20">
              {step}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Complaints() {
  const [filter, setFilter] = useState('All');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);

  const fetchComplaints = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }
    if (data) setComplaints(data);
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const filtered = complaints.filter(c => filter === 'All' || c.status === filter);
  
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  const total = useCountUp(totalCount);
  const pending = useCountUp(pendingCount);
  const inProgress = useCountUp(inProgressCount);
  const resolved = useCountUp(resolvedCount);

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto h-auto min-h-[calc(100vh-120px)] pb-0">
      
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">My Complaints</h1>
          <p className="text-sm text-muted mt-1">Track and manage your institutional requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', count: total, color: 'text-primary border-glass-border' },
          { label: 'Pending', count: pending, color: 'text-accent-amber border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.02)]' },
          { label: 'In Progress', count: inProgress, color: 'text-accent-blue border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.02)]' },
          { label: 'Resolved', count: resolved, color: 'text-accent-green border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.02)]' },
        ].map(s => (
          <div key={s.label} className={cn("glass-card p-4 border flex flex-col gap-1", s.color)}>
             <span className="text-2xl font-bold font-mono">{s.count}</span>
             <span className="text-xs font-semibold text-muted tracking-wider uppercase">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 custom-scrollbar">
        {['All', 'Pending', 'In Progress', 'Resolved', 'Closed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn("px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border", filter === f ? "bg-accent/20 border-accent text-accent" : "bg-glass border-glass-border text-muted hover:text-primary")}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-4">
        {filtered.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
              <Inbox size={48} className="text-muted mb-4" strokeWidth={1}/>
              <h3 className="font-semibold text-primary">No complaints found</h3>
              <p className="text-sm text-muted mt-1">Submit a new one to get started.</p>
           </div>
        ) : (
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
                onClick={() => setSelectedComplaint(c)}
              >
                <Card className={cn(
                  "p-5 flex flex-col md:flex-row gap-5 cursor-pointer relative overflow-hidden group hover:-translate-y-0.5",
                  c.status === 'Pending' ? 'border-l-4 border-l-accent-amber' : 
                  c.status === 'In Progress' ? 'border-l-4 border-l-accent-blue' :
                  c.status === 'Resolved' ? 'border-l-4 border-l-accent-green' : 'border-l-4 border-l-glass-border'
                )}>
                  <div className="flex-1 flex flex-col">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                       <span className="text-xs font-mono font-bold text-muted bg-elevated px-2 py-0.5 rounded border border-border tracking-wide">{c.complaint_code}</span>
                       <PriorityBadge priority={c.priority as any} />
                       <span className="ml-auto text-xs font-medium text-muted">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-bold text-primary text-lg mb-1">{c.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted mb-2">
                       <span className="flex items-center gap-1.5"><span className="text-accent">{CATEGORY_ICONS[c.category] || <Home size={14}/>}</span> {c.category}</span>
                       <span className="w-1 h-1 rounded-full bg-glass-border"/>
                       <span>{c.assigned_department ? 'Assigned' : 'Unassigned'}</span>
                    </div>

                    <MiniTimeline currentStep={getTimelineStep(c.status)} />
                  </div>

                  {c.admin_response && (
                    <div className="md:w-[260px] bg-accent/5 border border-accent/20 rounded-lg p-3 flex flex-col gap-2 shrink-0">
                      <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
                         <Bell size={12}/> Latest Update
                      </div>
                      <p className="text-sm text-primary/90 leading-tight line-clamp-3">"{c.admin_response}"</p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedComplaint(c); }}
                          className="text-xs text-accent mt-auto font-semibold hover:underline w-fit"
                        >
                          View Details →
                        </button>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <ComplaintDrawer 
        isOpen={!!selectedComplaint} 
        onClose={() => setSelectedComplaint(null)} 
        complaint={selectedComplaint}
      />
    </div>
  );
}
