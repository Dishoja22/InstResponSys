import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Copy, CheckCircle, ArrowRight, Home, BookOpen, Monitor, Library as LibraryIcon, Bus, Settings } from 'lucide-react';
import { useAIStore } from '../store/useAIStore';
import type { AIResult } from '../store/useAIStore';
import { Card } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/Badge';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

const categories = [
  { id: 'Hostel', icon: <Home size={24} />, label: 'Hostel' },
  { id: 'Academic', icon: <BookOpen size={24} />, label: 'Academic' },
  { id: 'IT', icon: <Monitor size={24} />, label: 'IT & Tech' },
  { id: 'Library', icon: <LibraryIcon size={24} />, label: 'Library' },
  { id: 'Transport', icon: <Bus size={24} />, label: 'Transport' },
  { id: 'Administration', icon: <Settings size={24} />, label: 'Administration' },
];

export default function Submit() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [description, setDescription] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIResult | null>(null);

  const { cache, addCacheContext } = useAIStore();
  const navigate = useNavigate();

  const addToast = useToastStore(s => s.addToast);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (description.length <= 20) {
        addToast({ title: 'Error', message: 'Description must be longer than 20 characters', variant: 'error' });
        return;
      }

      const hashInput = title + category + description;
      const cacheKey = btoa(encodeURIComponent(hashInput)).slice(0, 32);

      if (!cache[cacheKey]) {
        setIsAnalyzing(true);
        try {
          // Point 9: Remove hardcoded fallback
          const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
          if (!apiKey) throw new Error("Missing Gemini API Key. Please check environment variables.");

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `Analyze the complaint and respond ONLY with JSON:\n{\n  "priority": "LOW|MEDIUM|HIGH|URGENT",\n  "confidence": 85,\n  "priority_reason": "string",\n  "category": "Hostel|Academic|IT|Library|Transport|Administration",\n  "sentiment": "string",\n  "department": "string",\n  "expected_days": "string",\n  "tips": ["string"]\n}\n\nTitle: ${title}\nDescription: ${description}`
                }]
              }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (!res.ok) throw new Error("AI analysis service unavailable.");
          const data = await res.json();
          const parsed = JSON.parse(data.candidates[0].content.parts[0].text) as AIResult;
          addCacheContext(cacheKey, parsed);
          setAnalysis(parsed);
        } catch (err: any) {
          console.error("AI Triage Error:", err);
          const errResult: AIResult = {
            priority: 'MEDIUM',
            confidence: 50,
            priority_reason: 'Unable to reach AI services.',
            category: category || 'General',
            sentiment: 'Neutral',
            department: 'General Staff',
            expected_days: 'TBD',
            tips: ['Please contact support directly.']
          };
          addCacheContext(cacheKey, errResult);
          setAnalysis(errResult);
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        setAnalysis(cache[cacheKey]);
      }
      setStep(2);
    }
    else if (step === 2) {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('You must be logged in to submit a complaint');

        // Improved randomness: RSY-YYYY-5CHARS
        const year = new Date().getFullYear();
        const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const code = `RSY-${year}-${randomStr}`;

        const { data, error } = await supabase.from('complaints').insert({
          complaint_code: code,
          title,
          description,
          category: category || analysis?.category,
          priority: analysis?.priority || priority,
          submitted_by: user.id,
          ai_priority: analysis?.priority,
          ai_confidence: analysis?.confidence,
          ai_sentiment: analysis?.sentiment,
          ai_category: analysis?.category,
          ai_tips: analysis?.tips
        }).select().single();

        if (error) throw error;

        if (data) {
          setSubmittedCode(data.complaint_code);
          // Point 8: Create real notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            complaint_id: data.id,
            title: 'Complaint Submitted',
            message: `Your complaint ${data.complaint_code} is being reviewed.`,
            type: 'system',
            is_read: false
          });
        }

        setStep(3);
      } catch (err: any) {
        addToast({ title: 'Submission Failed', message: err.message, variant: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto h-auto min-h-[calc(100vh-120px)] pb-0">

      {/* Left Form Panel */}
      <Card className="flex-1 overflow-hidden flex flex-col gap-6 relative">
        <div className="flex gap-4 items-center text-sm font-semibold">
          <div className={cn("transition-colors", step >= 1 ? "text-accent" : "text-muted")}>1 Details</div>
          <ArrowRight size={14} className="text-muted" />
          <div className={cn("transition-colors", step >= 2 ? "text-accent" : "text-muted")}>2 Review</div>
          <ArrowRight size={14} className="text-muted" />
          <div className={cn("transition-colors", step >= 3 ? "text-accent-green" : "text-muted")}>3 Submitted</div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 pb-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-sm font-medium text-muted">Title</label>
                  <input required value={title} onChange={e => setTitle(e.target.value)} maxLength={100} placeholder="Brief summary of the issue" className="bg-elevated border border-border rounded-lg px-4 py-3 outline-none focus:border-accent w-full" />
                  <span className="absolute right-3 top-[38px] text-xs font-mono text-muted">{title.length}/100</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted">Category</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map(c => (
                      <button type="button" key={c.id} onClick={() => setCategory(c.id)} className={cn("bg-glass border rounded-lg p-3 flex flex-col gap-2 transition-all items-center", category === c.id ? "border-accent shadow-[0_0_12px_rgba(99,102,241,0.2)] text-primary" : "border-glass-border text-muted hover:border-accent/40")}>
                        <div className={cn("transition-colors", category === c.id ? "text-accent" : "text-muted")}>{c.icon}</div>
                        <span className="text-xs font-semibold">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-muted">Priority Indicator</label>
                  <div className="flex gap-2">
                    {['LOW', 'MEDIUM', 'HIGH'].map(p => (
                      <button type="button" key={p} onClick={() => setPriority(p as any)} className={cn("px-4 py-1.5 rounded-full text-xs font-semibold border transition-all", priority === p ? (p === 'HIGH' ? 'bg-accent-red/20 border-accent-red text-accent-red' : p === 'MEDIUM' ? 'bg-accent-blue/20 border-accent-blue text-accent-blue' : 'bg-muted/20 border-muted text-primary') : "border-glass-border text-muted")}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-sm font-medium text-muted">Description</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={5} placeholder="Provide details about the issue. Be descriptive so our AI can help categorize it accurately." className="bg-elevated border border-border rounded-lg px-4 py-3 outline-none focus:border-accent w-full resize-none custom-scrollbar" />
                  <span className="absolute right-3 bottom-3 text-xs font-mono text-muted bg-elevated/80 px-1">{description.length}/500</span>
                </div>

                <button type="submit" disabled={isAnalyzing} className="w-full mt-2 bg-gradient-to-r from-accent to-accent-violet hover:from-accent-violet hover:to-accent text-white font-semibold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-75">
                  {isAnalyzing ? 'Analyzing...' : 'Next: Review'} <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-5">
                <div className="bg-elevated border border-border rounded-xl p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm text-muted font-medium mb-1">Title</h3>
                    <p className="text-primary font-semibold">{title}</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <h3 className="text-sm text-muted font-medium mb-1">Category</h3>
                      <div className="flex items-center gap-1.5"><span className="text-accent">{categories.find(c => c.id === category)?.icon}</span><span className="text-primary font-semibold">{category}</span></div>
                    </div>
                    <div>
                      <h3 className="text-sm text-muted font-medium mb-1">Priority</h3>
                      <PriorityBadge priority={priority} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted font-medium mb-1">Description</h3>
                    <p className="text-primary text-sm whitespace-pre-wrap">{description}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-glass border border-glass-border hover:border-muted text-primary font-semibold py-3 rounded-lg transition-colors">
                    Edit
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-gradient-to-r from-accent to-accent-violet text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Submitting...' : 'Submit Complaint'} <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full gap-5 text-center min-h-[300px]">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}>
                  {/* Requires Framer Motion pathLength for stroke draw, we simulate with simple scale here */}
                  <CheckCircle size={80} className="text-accent-green" strokeWidth={1.5} />
                </motion.div>
                <h2 className="text-2xl font-bold text-accent-green">Complaint Submitted!</h2>

                <div className="bg-elevated border border-accent/20 px-6 py-3 rounded-xl flex items-center gap-4 group">
                  <span className="font-mono text-lg font-bold text-primary tracking-wide">{submittedCode}</span>
                  <button onClick={() => { navigator.clipboard.writeText(submittedCode); }} className="text-accent hover:text-accent-violet transition-colors">
                    <Copy size={18} />
                  </button>
                </div>

                <div className="flex gap-3 mt-4 w-full">
                  <button onClick={() => {
                    setStep(1);
                    setTitle('');
                    setDescription('');
                    setCategory('');
                    setPriority('MEDIUM');
                    setAnalysis(null);
                  }} className="flex-1 bg-glass border border-glass-border hover:border-muted text-primary py-3 rounded-lg font-semibold text-sm">
                    Submit Another
                  </button>
                  <button onClick={() => navigate('/complaints')} className="flex-1 bg-accent/20 border border-accent/40 text-accent py-3 rounded-lg font-semibold text-sm">
                    View My Complaints
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Card>

      {/* Right AI Panel */}
      <Card className="lg:w-[320px] shrink-0 border-accent-violet/20 shadow-[0_0_30px_rgba(139,92,246,0.05)] flex flex-col min-h-[200px] lg:min-h-0">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-accent-violet" size={20} />
          <h2 className="font-bold text-primary">AI Triage</h2>
          <span className="ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent-violet/15 text-accent-violet border border-accent-violet/30">Gemini 2.0</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {!analysis && !isAnalyzing ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-10">
              <Brain size={48} className="mb-4 text-muted" strokeWidth={1} />
              <p className="text-sm font-medium">Draft your complaint and click Next to let our AI analyze it for prioritization.</p>
            </div>
          ) : isAnalyzing ? (
            <div className="flex flex-col gap-4 animate-pulse">
              <div className="text-sm text-accent-violet mb-2 font-medium">Analyzing...</div>
              <div className="h-20 bg-glass-border rounded-lg" />
              <div className="h-12 bg-glass-border rounded-lg" />
              <div className="h-24 bg-glass-border rounded-lg" />
            </div>
          ) : analysis ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div className="bg-glass border border-glass-border rounded-lg p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Predicted Priority</span>
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={analysis.priority} />
                  <span className="text-xs font-mono text-muted">{analysis.confidence}% conf</span>
                </div>
                <p className="text-xs text-primary leading-snug">{analysis.priority_reason}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-glass border border-glass-border rounded-lg p-3 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Category</span>
                  <span className="text-sm font-semibold text-primary">{analysis.category}</span>
                </div>
                <div className="bg-glass border border-glass-border rounded-lg p-3 flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Tone</span>
                  <span className="text-sm font-semibold text-primary">{analysis.sentiment}</span>
                </div>
              </div>

              <div className="bg-[rgba(99,102,241,0.05)] border border-[rgba(99,102,241,0.15)] rounded-lg p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Route To</span>
                <span className="text-sm font-semibold text-primary">{analysis.department}</span>
                <span className="text-[10px] text-muted">Expected: {analysis.expected_days}</span>
              </div>

              <div className="bg-elevated border border-border rounded-lg p-3 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Quick Tips</span>
                <ul className="text-xs text-primary space-y-2 pl-3 list-disc marker:text-accent-violet">
                  {analysis.tips.map((tip, i) => (
                    <li key={i} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
