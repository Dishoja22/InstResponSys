import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ClipboardPaste, ArrowRight, XCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/Badge';

export default function Track() {
  const [loading, setLoading] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [error, setError] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId) return;
    
    setLoading(true);
    setError(false);
    setResult(null);

    const { data, error: fetchError } = await supabase
      .from('complaints')
      .select('*, submitted_by:users(full_name)')
      .eq('complaint_code', complaintId.trim())
      .single();

    if (fetchError || !data) {
      setError(true);
    } else {
      const statusMap: Record<string, number> = {
        'Pending': 25,
        'In Progress': 60,
        'Resolved': 100,
        'Closed': 100
      };
      
      setResult({
        id: data.complaint_code,
        title: data.title,
        status: data.status,
        progress: statusMap[data.status] || 25,
        latestAction: data.admin_response || 'Your complaint is currently under review.'
      });
    }
    setLoading(false);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setComplaintId(text);
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[calc(100vh-140px)] p-4">
      <div className="w-full max-w-[560px] flex flex-col gap-8">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-primary mb-3">Track Your Complaint</h1>
          <p className="text-muted">Enter your unique complaint ID to check its current status.</p>
        </div>

        <form onSubmit={handleTrack} className="flex flex-col gap-4">
          <div className="relative">
            <input 
              value={complaintId}
              onChange={(e) => {
                setComplaintId(e.target.value);
                setError(false);
              }}
              placeholder="RSY-2024-XXXXX"
              className="w-full bg-elevated border-2 border-border focus:border-accent rounded-xl text-lg font-mono px-6 py-4 outline-none transition-colors shadow-inner"
            />
            <button 
              type="button" 
              onClick={handlePaste}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors p-2"
              title="Paste from clipboard"
            >
              <ClipboardPaste size={20} />
            </button>
          </div>
          <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gradient-to-r from-accent to-accent-violet hover:from-accent-violet hover:to-accent text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Track Complaint <ArrowRight size={20} /></>
          )}
        </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="bg-accent-red/10 border border-accent-red/30 text-accent-red px-6 py-4 rounded-xl flex items-center gap-3 font-medium"
            >
              <XCircle size={20} />
              No complaint found with this ID. Please check and try again.
            </motion.div>
          )}

          {result && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="hover:scale-100 cursor-default border-accent/30 shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-primary mb-1">{result.title}</h2>
                    <span className="font-mono text-sm text-accent">{result.id}</span>
                  </div>
                  <StatusBadge status={result.status as any} className="text-sm px-3 py-1" />
                </div>

                {/* Simplified timeline for tracking view */}
                <div className="h-1.5 w-full bg-glass-border rounded-full overflow-hidden mb-6">
                   <div 
                      className="h-full bg-accent rounded-full transition-all duration-1000" 
                      style={{ width: `${result.progress}%` }}
                   />
                </div>

                <div className="bg-glass border border-glass-border rounded-lg p-4 mb-4">
                  <span className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Latest Activity</span>
                  <p className="text-sm font-medium text-primary leading-relaxed">{result.latestAction}</p>
                </div>

                <button className="text-accent text-sm font-semibold hover:underline w-full text-center py-2">
                  View Full Details →
                </button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
