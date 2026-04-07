import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Calendar, Bell } from 'lucide-react';
import { StatusBadge, PriorityBadge } from './Badge';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  complaint?: any;
  onUpdate?: () => void;
}

export function ComplaintDrawer({ isOpen, onClose, isAdmin, complaint, onUpdate }: DrawerProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState('Pending');
  const [priority, setPriority] = useState('MEDIUM');
  const [department, setDepartment] = useState('');
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [facultyList, setFacultyList] = useState<any[]>([]);

  // Sync internal state when complaint changes
  useEffect(() => {
    if (complaint) {
      setResponse(complaint.admin_response || '');
      setStatus(complaint.status || 'Pending');
      setPriority(complaint.priority || 'MEDIUM');
      setDepartment(complaint.assigned_department || '');
      setAssignedTo(complaint.assigned_to || null);
    }
  }, [complaint, isOpen]);

  // Fetch faculty list for assignment
  useEffect(() => {
    if (isOpen && isAdmin) {
      const fetchFaculty = async () => {
        const { data } = await supabase
          .from('users')
          .select('id, full_name, email')
          .eq('role', 'faculty');
        if (data) setFacultyList(data);
      };
      fetchFaculty();
    }
  }, [isOpen, isAdmin]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleUpdate = async () => {
    if (!complaint?.id) return;
    setLoading(true);
    const { error } = await supabase
      .from('complaints')
      .update({ 
        status, 
        priority,
        assigned_department: department,
        assigned_officer: assignedTo,
        admin_response: response,
        resolved_at: status === 'Resolved' ? new Date().toISOString() : null 
      })
      .eq('id', complaint.id);

    if (error) {
       console.error('Update failed:', error);
    } else {
       // Create notification for student
       await supabase.from('notifications').insert({
         user_id: complaint.submitted_by,
         complaint_id: complaint.id,
         title: 'Complaint Updated',
         message: `Your complaint ${complaint.complaint_code} is now ${status}.` + 
                  (assignedTo ? ' It has been assigned to a specialist.' : ''),
         type: status === 'Resolved' ? 'resolved' : 'update'
       });

       if (onUpdate) onUpdate();
       
       // Log activity
       const { data: { user: authUser } } = await supabase.auth.getUser();
       if (authUser) {
         await supabase.from('activity_log').insert({
           complaint_id: complaint.id,
           action_by: authUser.id,
           action_type: 'update',
           details: `Status: ${status}, Priority: ${priority}` + 
                    (assignedTo ? `, Assigned to: ${assignedTo}` : '') + 
                    (response ? `, Note: ${response.substring(0, 50)}...` : '')
         });
       }

       onClose();
    }
    setLoading(false);
  };

  if (!complaint && isOpen) return null;

  const depts = ['IT & Technical', 'Maintenance', 'Academic Affairs', 'Hostel & Mess', 'Library', 'Transport', 'Administration'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-[500px] bg-surface border-l border-glass-border shadow-2xl z-[200] flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 p-6 border-b border-glass-border flex flex-col gap-4 bg-elevated/50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-lg border border-accent/20 w-fit">
                  <span className="font-mono font-bold tracking-wide text-sm">{complaint.complaint_code}</span>
                  <button onClick={() => { navigator.clipboard.writeText(complaint.complaint_code); }} className="hover:text-primary transition-colors">
                    <Copy size={14}/>
                  </button>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-glass">
                  <X size={20} />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary leading-snug mb-3">{complaint.title}</h2>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={status as any} />
                  <PriorityBadge priority={priority as any} />
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8 text-primary">
              
              {/* DETAILS */}
              <div className="flex flex-col gap-4">
                 <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Complaint Details</h3>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="bg-glass rounded-lg border border-glass-border p-3">
                      <span className="text-[10px] text-muted uppercase">Category</span>
                      <div className="text-sm font-semibold">{complaint.category}</div>
                   </div>
                   <div className="bg-glass rounded-lg border border-glass-border p-3">
                      <span className="text-[10px] text-muted uppercase">Department</span>
                      <div className="text-sm font-semibold">{complaint.assigned_department || 'Unassigned'}</div>
                   </div>
                   <div className="bg-glass rounded-lg border border-glass-border p-3 col-span-2">
                      <span className="text-[10px] text-muted uppercase flex items-center gap-1"><Calendar size={12}/> Submitted On</span>
                      <div className="text-sm font-semibold">{new Date(complaint.created_at).toLocaleString()}</div>
                   </div>
                   {complaint.assigned_officer_profile && (
                     <div className="bg-accent/10 rounded-lg border border-accent/20 p-3 col-span-2">
                        <span className="text-[10px] text-accent uppercase font-bold">Assigned Specialist</span>
                        <div className="text-sm font-bold text-primary">{complaint.assigned_officer_profile.full_name}</div>
                     </div>
                   )}
                 </div>
                 
                 <div className="bg-elevated rounded-lg border border-border p-4 mt-1">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {complaint.description || complaint.title}
                    </p>
                 </div>
              </div>

              {/* AI INSIGHTS */}
              {(complaint.ai_priority || complaint.ai_tips) && (
                <div className="bg-accent-violet/10 border border-accent-violet/20 rounded-xl p-4 flex flex-col gap-3">
                   <div className="flex items-center gap-2 text-accent-violet font-semibold text-xs uppercase tracking-wider">
                     AI Analysis
                   </div>
                   <div className="grid grid-cols-2 gap-2 text-sm">
                     <div>AI Suggested: <span className="font-semibold text-primary">{complaint.ai_priority || 'N/A'}</span></div>
                     <div>Tone: <span className="font-semibold text-primary">{complaint.ai_sentiment || 'Neutral'}</span></div>
                   </div>
                   {complaint.ai_tips && (
                     <div className="text-xs text-muted mt-1 italic">
                        Tips: {complaint.ai_tips.join(', ')}
                     </div>
                   )}
                </div>
              )}

              {/* STUDENT VIEW - IF RESOLVED */}
              {!isAdmin && complaint.admin_response && (
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-2">
                    <Bell size={14}/> Resolution Response
                  </h3>
                  <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 text-sm italic">
                    "{complaint.admin_response}"
                  </div>
                </div>
              )}

            </div>

            {/* Admin Controls (Bottom Sticky) */}
            {isAdmin && (
              <div className="shrink-0 p-5 border-t border-glass-border bg-elevated w-full shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                 <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted uppercase px-1">Status</label>
                        <select 
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="bg-surface border border-border rounded-lg px-3 py-2 outline-none text-sm text-primary focus:border-accent"
                        >
                          <option>Pending</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted uppercase px-1">Priority</label>
                        <select 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="bg-surface border border-border rounded-lg px-3 py-2 outline-none text-sm text-primary focus:border-accent"
                        >
                          <option>LOW</option>
                          <option>MEDIUM</option>
                          <option>HIGH</option>
                          <option>URGENT</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted uppercase px-1">Dept</label>
                        <select 
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="bg-surface border border-border rounded-lg px-3 py-2 outline-none text-sm text-primary focus:border-accent"
                        >
                          <option value="">Unassigned</option>
                          {depts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-muted uppercase px-1">Assign Faculty</label>
                        <select 
                          value={assignedTo || ''}
                          onChange={(e) => setAssignedTo(e.target.value || null)}
                          className="bg-surface border border-border rounded-lg px-3 py-2 outline-none text-sm text-primary focus:border-accent"
                        >
                          <option value="">Unassigned</option>
                          {facultyList.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted uppercase px-1">Official Response</label>
                      <textarea 
                        placeholder="Resolution details..." 
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        className="bg-surface border border-border rounded-lg p-3 text-sm text-primary outline-none focus:border-accent resize-none h-20"
                      />
                    </div>
                    
                    <button 
                      onClick={handleUpdate}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-accent to-accent-violet text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-accent/40 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Update Complaint & Notify'}
                    </button>
                 </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
