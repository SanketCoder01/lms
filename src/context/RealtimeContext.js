/**
 * src/context/RealtimeContext.js
 * ------------------------------
 * Handles real-time updates for:
 * - Session termination notifications
 * - Announcements broadcast
 * - Data refresh triggers
 * Uses Supabase Realtime subscriptions (no localStorage).
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const RealtimeContext = createContext(null);

export const RealtimeProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [sessionKilled, setSessionKilled] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Subscribe to announcements
  useEffect(() => {
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('Announcement update:', payload);
          if (payload.eventType === 'INSERT') {
            setAnnouncements(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAnnouncements(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new : a)
            );
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev => 
              prev.filter(a => a.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to session termination notifications
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const channel = supabase
          .channel(`session:${session.user.id}`)
          .on('broadcast', { event: 'session_killed' }, (payload) => {
            console.log('Session killed notification:', payload);
            setSessionKilled(true);
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to data changes for real-time dashboard updates
  useEffect(() => {
    const channel = supabase
      .channel('data_refresh')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'projects' },
        () => setRefreshTrigger(t => t + 1)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'leases' },
        () => setRefreshTrigger(t => t + 1)
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'units' },
        () => setRefreshTrigger(t => t + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load initial announcements
  const loadAnnouncements = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Clear session killed flag
  const clearSessionKilled = useCallback(() => {
    setSessionKilled(false);
  }, []);

  // Force refresh trigger
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(t => t + 1);
  }, []);

  return (
    <RealtimeContext.Provider value={{
      announcements,
      sessionKilled,
      refreshTrigger,
      clearSessionKilled,
      triggerRefresh,
      loadAnnouncements,
    }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error('useRealtime must be used inside RealtimeProvider');
  return ctx;
};

export default RealtimeContext;
