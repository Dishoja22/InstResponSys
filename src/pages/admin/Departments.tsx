import { useEffect, useState } from 'react';
import { Building2, Plus, Users, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function AdminDepartments() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    const { data: deptData, error: deptError } = await supabase.from('departments').select('*');
    if (deptError) {
      console.error('Error fetching departments:', deptError);
      return;
    }

    // Get staff counts per department
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('department')
      .not('department', 'is', null);
    
    if (userError) {
      console.error('Error fetching staff:', userError);
      setDepts(deptData || []);
    } else {
      const counts: Record<string, number> = {};
      userData.forEach((u: any) => {
        counts[u.department] = (counts[u.department] || 0) + 1;
      });
      
      const enriched = deptData.map(d => ({
        ...d,
        staffCount: counts[d.name] || 0
      }));
      setDepts(enriched);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 w-full h-[calc(100vh-120px)] mx-auto max-w-7xl">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">Department Management</h1>
          <p className="text-sm text-muted mt-1">Manage and assign staff to institutional departments.</p>
        </div>
        <button className="bg-accent hover:bg-accent-violet text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg hover:-translate-y-0.5">
          <Plus size={18} /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
             <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : depts.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-50">
             <Building2 size={48} className="mx-auto mb-4 text-muted" strokeWidth={1}/>
             <p className="text-primary font-medium">No departments found.</p>
          </div>
        ) : (
          depts.map(d => (
            <div key={d.id} className="glass-card p-5 group flex flex-col gap-4 border border-glass-border hover:border-accent/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Building2 size={24} />
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Head of Dept</span>
                  <span className="text-sm font-semibold text-primary truncate max-w-[150px]">{d.head_name || 'Unassigned'}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-primary group-hover:text-accent transition-colors">{d.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted mt-1">
                  <Users size={14} /> {d.staffCount || 0} Staff Members
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-glass-border">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-amber uppercase tracking-widest flex items-center gap-1">
                     <Clock size={10}/> Resolution
                  </span>
                  <span className="text-xl font-mono font-bold text-primary">{d.avg_resolution_days || 0}d</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-accent-green uppercase tracking-widest flex items-center gap-1">
                     <CheckCircle size={10}/> Status
                  </span>
                  <span className="text-sm font-mono font-bold text-accent-green">ACTIVE</span>
                </div>
              </div>

              <button 
                onClick={() => navigate('/admin/analytics')}
                className="w-full py-2 rounded-lg bg-surface border border-border text-xs font-bold text-muted hover:text-primary hover:bg-glass transition-all mt-auto"
              >
                View Analytics & Staff
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
