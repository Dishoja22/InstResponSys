import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Bell, CheckCircle2, MessageSquare, Inbox, RefreshCcw, Shield } from 'lucide-react';
import { supabase, subscribeToNotifications } from '../lib/supabase';

export default function Notifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    let sub: any;
    const setupSub = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        sub = subscribeToNotifications(user.id, () => {
          fetchNotifications();
        });
      }
    };
    setupSub();

    return () => {
      if (sub) supabase.removeChannel(sub);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_update': return { icon: RefreshCcw, color: 'text-accent' };
      case 'admin_response': return { icon: MessageSquare, color: 'text-accent-violet' };
      case 'assigned': return { icon: Shield, color: 'text-primary' };
      case 'resolved': return { icon: CheckCircle2, color: 'text-green-500' };
      case 'system': return { icon: Inbox, color: 'text-muted' };
      default: return { icon: Bell, color: 'text-muted' };
    }
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
    if (!error) setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto h-[calc(100vh-120px)] lg:h-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Bell className="text-accent" size={24}/> Notifications</h1>
          <p className="text-sm text-muted mt-1">All your alerts and system messages.</p>
        </div>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllAsRead} className="text-sm font-bold text-accent hover:text-accent-violet transition-colors px-4 py-2 border border-accent/20 rounded-xl hover:bg-accent/10">
            Mark all as read
          </button>
        )}
      </div>
      
      <Card className="flex flex-col overflow-hidden p-0 border-glass-border min-h-[200px]">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
             <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-50">
             <Inbox size={48} className="text-muted mb-4" strokeWidth={1}/>
             <p className="text-sm text-primary font-medium">No notifications yet.</p>
          </div>
        ) : (
          notifications.map(n => {
            const { icon: Icon, color } = getIcon(n.type);
            return (
              <div 
                key={n.id} 
                onClick={() => !n.is_read && markAsRead(n.id)}
                className={`p-5 border-b border-glass-border flex gap-4 transition-colors hover:bg-glass/50 cursor-pointer ${!n.is_read ? 'bg-accent/5' : ''}`}
              >
                 <Icon size={24} className={`${!n.is_read ? color : 'text-muted'} shrink-0 mt-0.5`} />
                 <div className="flex flex-col gap-1.5 flex-1 p-0.5">
                   <h4 className={`text-base font-bold leading-none ${!n.is_read ? 'text-primary' : 'text-muted'}`}>{n.title}</h4>
                   <p className={`text-sm lg:w-[85%] ${!n.is_read ? 'text-primary/95' : 'text-muted/80'}`}>{n.message}</p>
                   <span className="text-xs text-muted font-medium mt-1 uppercase tracking-wider">{new Date(n.created_at).toLocaleString()}</span>
                 </div>
                 {!n.is_read && <div className="w-2.5 h-2.5 bg-accent rounded-full shrink-0 mt-2 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
              </div>
            )
          })
        )}
      </Card>
      
      {notifications.length > 0 && (
        <div className="flex justify-center mt-4">
          <button className="text-sm font-semibold text-accent hover:text-accent-violet transition-colors">
            Load older notifications
          </button>
        </div>
      )}
    </div>
  );
}
