import { useState, useEffect } from 'react';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Building, GraduationCap, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useToastStore } from '../store/useToastStore';

export default function Login() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const [tab, setTab] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<'student' | 'faculty' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmingEmail, setConfirmingEmail] = useState(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Hostel');
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (tab === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
              department: role !== 'student' ? department : null,
            }
          }
        });

        if (error) throw error;
        setConfirmingEmail(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        // Use user metadata to determine routing
        const uRole = data.user.user_metadata?.role || 'student';
        if (uRole === 'admin' || uRole === 'faculty') navigate('/admin/dashboard');
        else navigate('/complaints');
      }
    } catch (err: any) {
      addToast({
        title: 'Authentication Error',
        message: err.message,
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-base text-primary overflow-hidden">
      
      {/* Left Panel - Desktop Only */}
      <div className="hidden lg:flex flex-col relative w-[42%] bg-[#060610] border-r border-glass-border overflow-hidden p-12">
        
        {init && (
          <Particles
            id="tsparticles"
            options={{
              background: { color: { value: "transparent" } },
              fpsLimit: 60,
              particles: {
                color: { value: "#ffffff" },
                links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.2, width: 1 },
                move: { enable: true, speed: 0.8 },
                number: { density: { enable: true }, value: 80 },
                opacity: { value: 0.5 },
                size: { value: { min: 1, max: 2.5 } },
              },
            }}
            className="absolute inset-0 z-0 pointer-events-none"
          />
        )}
        
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-violet) 0%, transparent 60%), radial-gradient(circle at 10% 80%, var(--accent) 0%, transparent 50%)' }} />

        <div className="relative z-10 my-auto">
          <div className="flex items-center gap-4 mb-6 text-accent">
            <ShieldCheck size={64} strokeWidth={2} />
            <span className="font-extrabold text-5xl tracking-tight text-white">ResponSys</span>
          </div>
          <p className="text-xl text-muted/80 font-medium">Resolve. Track. Trust.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-[58%] flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[440px] flex flex-col items-center">
          
          {/* Logo visible only on mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8 text-accent">
            <ShieldCheck size={32} />
            <span className="font-extrabold text-2xl">ResponSys</span>
          </div>

          {/* Tab Switcher */}
          <div className="w-full glass-card p-1.5 flex mb-8 rounded-xl relative">
            {['signin', 'register'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as 'signin' | 'register')}
                className={cn("flex-1 py-2 text-sm font-semibold rounded-lg z-10 transition-colors", tab === t ? "text-primary" : "text-muted hover:text-primary")}
              >
                {t === 'signin' ? 'Sign In' : 'Register'}
              </button>
            ))}
            <motion.div
              layoutId="loginTab"
              className="absolute left-1.5 top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-elevated rounded-lg shadow-sm border border-glass-border"
              initial={false}
              animate={{ x: tab === 'signin' ? 0 : '100%' }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          </div>

          {/* Form Area */}
          <div className="w-full relative">
            <AnimatePresence mode="wait">
              {confirmingEmail ? (
                <motion.div
                  key="confirmEmail"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full glass-card p-6 md:p-8 rounded-xl flex flex-col items-center text-center gap-4 border border-glass-border shadow-2xl relative z-20 bg-surface/80 backdrop-blur-xl"
                >
                  <div className="w-16 h-16 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green mb-2">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-primary">Check your Inbox!</h3>
                  <p className="text-sm text-muted">We've sent a secure confirmation link to your email address. Click the link to verify your account and continue.</p>
                  <button onClick={() => { setConfirmingEmail(false); setTab('signin'); }} className="mt-4 w-full bg-glass hover:bg-white/5 border border-glass-border text-primary font-semibold py-2.5 rounded-lg transition-all">
                     Back to Sign In
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={tab}
                initial={{ opacity: 0, x: tab === 'signin' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: tab === 'signin' ? 20 : -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {tab === 'signin' ? (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-muted">Email</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" className="bg-elevated border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent transition-colors w-full" />
                    </div>
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-sm font-medium text-muted">Password</label>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="bg-elevated border border-border rounded-lg pl-4 pr-10 py-2.5 outline-none focus:border-accent transition-colors w-full" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[34px] text-muted hover:text-primary">
                        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-accent to-accent-violet hover:from-accent-violet hover:to-accent text-white font-semibold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50">
                      {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
                    {/* Role Selector */}
                    <div className="flex gap-2">
                      {[
                        { id: 'student', icon: GraduationCap, label: 'Student' },
                        { id: 'faculty', icon: User, label: 'Faculty' },
                        { id: 'admin', icon: Building, label: 'Admin' }
                      ].map(r => (
                        <button key={r.id} type="button" onClick={() => setRole(r.id as any)} className={cn("flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all bg-glass", role === r.id ? "border-accent text-accent shadow-[0_0_10px_rgba(99,102,241,0.2)]" : "border-glass-border text-muted hover:text-primary")}>
                          <r.icon size={20} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">{r.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-sm font-medium text-muted">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" className="bg-elevated border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent w-full" />
                      </div>
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-sm font-medium text-muted">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" className="bg-elevated border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent w-full" />
                      </div>
                      <div className="flex flex-col gap-1.5 col-span-2">
                        <label className="text-sm font-medium text-muted">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Create a password" className="bg-elevated border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent w-full" />
                      </div>
                      {role !== 'student' && (
                        <div className="flex flex-col gap-1.5 col-span-2">
                          <label className="text-sm font-medium text-muted">Department</label>
                          <select value={department} onChange={e => setDepartment(e.target.value)} className="bg-elevated border border-border rounded-lg px-4 py-2.5 outline-none focus:border-accent text-sm w-full appearance-none">
                            <option value="Hostel">Hostel</option>
                            <option value="Academic">Academic</option>
                            <option value="IT">IT</option>
                            <option value="Library">Library</option>
                            <option value="Transport">Transport</option>
                            <option value="Administration">Administration</option>
                          </select>
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-gradient-to-r from-accent to-accent-violet text-white font-semibold py-2.5 rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] disabled:opacity-50">
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  </form>
                )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
