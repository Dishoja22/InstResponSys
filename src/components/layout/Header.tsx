import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Moon, Sun, Menu, CheckCircle2, MessageSquare, User, Settings, LogOut, PlusCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import { supabase } from '../../lib/supabase';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore((state) => state.addToast);
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('U');
  const [userName, setUserName] = useState('User');

  useEffect(() => {

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || '');
        const fullName = user.user_metadata?.full_name || 'User';
        setUserName(fullName);
        setUserInitials(fullName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase());
        
        // Fetch real notifications
        supabase.from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data) setNotifications(data);
          });
      }
    });

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const handleDemofeature = (feature: string) => {
    setShowProfile(false);
    addToast({
      title: `${feature} Coming Soon`,
      message: `The ${feature} page is simulated for the purpose of this demo.`,
      variant: 'info'
    });
  };

  const handleLogout = async () => {
    setShowProfile(false);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = async (id: number) => {
    // Mark as read in UI
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    setShowNotif(false);
    
    // Mark as read in DB
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    
    navigate('/complaints');
  };

  // Convert pathname to Breadcrumb, e.g. /admin/dashboard -> Admin / Dashboard
  const breadcrumb = location.pathname
    .split('/')
    .filter(Boolean)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' · ');

  return (
    <header className="h-[56px] flex items-center justify-between px-6 sticky top-0 z-[100] border-b border-glass-border"
            style={{ background: 'rgba(6, 6, 15, 0.85)', backdropFilter: 'blur(20px)' }}>
      
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button placeholder */}
        <button className="md:hidden text-muted hover:text-primary">
          <Menu size={20} />
        </button>
        <h1 className="text-sm font-semibold text-muted tracking-wide">
          {breadcrumb || 'Home'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/submit')} className="hidden md:flex bg-gradient-to-r from-accent to-accent-violet text-white font-semibold py-1.5 px-4 rounded-lg items-center justify-center gap-2 shadow-[0_0_10px_rgba(99,102,241,0.3)] hover:-translate-y-0.5 transition-transform text-sm mr-2">
          <PlusCircle size={14} /> New Complaint
        </button>
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="relative text-muted hover:text-primary transition-colors p-2 rounded-full hover:bg-glass"
          >
            <Bell size={18} />
            {notifications.some(n => n.unread) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-[320px] bg-[#0A0A12] border border-glass-border p-1 shadow-2xl flex flex-col z-50 origin-top-right rounded-lg"
              >
                <div className="flex items-center justify-between px-3 py-3 border-b border-glass-border">
                  <span className="text-sm font-bold text-primary">Notifications</span>
                  <button onClick={markAllRead} className="text-[11px] font-semibold text-accent hover:underline">Mark all read</button>
                </div>
                
                <div className="flex flex-col max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.map((n) => {
                    return (
                      <div key={n.id} onClick={() => handleNotificationClick(n.id)} className={`flex items-start gap-3 p-3 transition-colors hover:bg-glass cursor-pointer ${!n.is_read ? 'bg-glass/80 border-l-2 border-l-accent' : ''}`}>
                         <Bell size={16} className={`text-accent mt-0.5 shrink-0`} />
                         <div className="flex flex-col flex-1 gap-0.5">
                            <span className="text-xs font-bold text-primary truncate max-w-[220px]">{n.title}</span>
                            <span className="text-xs text-muted leading-snug line-clamp-2">{n.message}</span>
                            <span className="text-[10px] text-muted mt-1 font-medium">{new Date(n.created_at).toLocaleDateString()}</span>
                         </div>
                         {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent mt-1" />}
                      </div>
                    );
                  })}
                </div>
                
                <div className="p-2 border-t border-glass-border mt-1">
                  <button onClick={() => { setShowNotif(false); handleDemofeature('All Notifications'); }} className="w-full text-center text-xs font-semibold text-muted hover:text-primary p-1 transition-colors">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-accent-violet border border-accent/30 flex items-center justify-center text-xs font-semibold text-white shadow-lg cursor-pointer hover:shadow-accent/40 transition-shadow"
          >
            {userInitials}
          </div>
          
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-12 w-[220px] bg-[#0A0A12] border border-glass-border p-1 shadow-2xl flex flex-col z-50 origin-top-right rounded-lg"
              >
                <div className="flex flex-col px-4 py-3 border-b border-glass-border">
                  <span className="text-sm font-bold text-primary">{userName}</span>
                  <span className="text-xs text-muted">{userEmail}</span>
                </div>
                
                <div className="py-1 flex flex-col">
                  <button onClick={() => handleDemofeature('Profile')} className="text-left px-4 py-2 text-sm text-primary hover:bg-glass hover:text-accent transition-colors flex items-center gap-2">
                    <User size={14} /> My Profile
                  </button>
                  <button onClick={() => handleDemofeature('Settings')} className="text-left px-4 py-2 text-sm text-primary hover:bg-glass hover:text-accent transition-colors flex items-center gap-2">
                    <Settings size={14} /> Settings
                  </button>
                </div>
                
                <div className="p-1 border-t border-glass-border mt-1">
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-semibold text-accent-red hover:bg-accent-red/10 rounded transition-colors flex items-center gap-2">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
