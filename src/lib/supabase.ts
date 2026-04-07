import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin dashboard real-time sync (Updated per audit)
export const subscribeToAllComplaints = (callback: () => void) => {
  return supabase
    .channel('all-complaints')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, callback)
    .subscribe();
};

// Student/Faculty real-time sync for their own complaints
export const subscribeToMyComplaints = (userId: string, callback: () => void) => {
  return supabase
    .channel(`my-complaints-${userId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'complaints',
      filter: `submitted_by=eq.${userId}` 
    }, callback)
    .subscribe();
};

// Notifications real-time sync (Updated per audit)
export const subscribeToNotifications = (userId: string, callback: () => void) => {
  return supabase
    .channel(`notifications-${userId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications',
      filter: `user_id=eq.${userId}` 
    }, callback)
    .subscribe();
};
