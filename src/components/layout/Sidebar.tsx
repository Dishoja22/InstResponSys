import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart3, 
  Building2, 
  Settings,
  PlusCircle,
  Bell,
  Search,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useEffect, useState } from 'react';

const studentLinks = [
  { name: 'My Complaints', to: '/complaints', icon: ListTodo },
  { name: 'Submit Complaint', to: '/submit', icon: PlusCircle },
  { name: 'Track Complaint', to: '/track', icon: Search },
  { name: 'Notifications', to: '/notifications', icon: Bell },
];

const adminLinks = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'All Complaints', to: '/admin/complaints', icon: ListTodo },
  { name: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { name: 'Departments', to: '/admin/departments', icon: Building2 },
  { name: 'Settings', to: '/admin/settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  // TODO: change this dynamically from auth store
  const isAdmin = location.pathname.startsWith('/admin');
  const links = isAdmin ? adminLinks : studentLinks;

  const [userName, setUserName] = useState('User');
  const [userInitials, setUserInitials] = useState('U');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || 'User';
        setUserName(fullName);
        setUserInitials(fullName.split(' ').map((n: string) => n[0]).join('').substring(0,2).toUpperCase());
      }
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <aside className="w-[220px] h-screen fixed hidden md:flex flex-col flex-shrink-0 z-50 border-r border-glass-border"
           style={{ 
             background: 'linear-gradient(180deg, #09091A 0%, #060610 100%)' 
           }}>
      {/* Left accent strip */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px]"
           style={{ background: 'linear-gradient(180deg, var(--accent), var(--accent-violet), transparent)' }} />
      
      {/* Logo Area */}
      <div className="h-[56px] flex items-center px-6 gap-3">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-accent"
        >
          <ShieldCheck size={28} strokeWidth={1.5} />
        </motion.div>
        <span className="font-sans font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-violet">
          ResponSys
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;
          
          return (
            <Link
              key={link.name}
              to={link.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all relative",
                isActive 
                  ? "text-primary bg-gradient-to-r from-accent/20 to-transparent border-l-2 border-accent" 
                  : "text-muted hover:text-primary hover:bg-glass"
              )}
            >
              <Icon size={18} className={cn(isActive ? "text-accent drop-shadow-[0_0_8px_rgba(99,102,241,0.8)]" : "text-muted")} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-glass-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-semibold text-xs text-primary">
            {userInitials}
          </div>
          <div className="flex flex-col">
             <span className="text-sm font-semibold truncate leading-tight">{userName}</span>
             <span className="text-xs text-muted leading-tight">{isAdmin ? 'Admin' : 'Student'}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 text-sm text-accent-red/80 hover:text-accent-red transition-colors px-2 py-1.5 rounded-lg hover:bg-accent-red/10">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
