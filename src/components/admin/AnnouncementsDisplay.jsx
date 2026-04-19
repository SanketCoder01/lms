/**
 * AnnouncementsDisplay.jsx
 * ------------------------
 * Displays real-time announcements from admin.
 * Listens to Supabase Realtime for new announcements.
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AnnouncementsDisplay = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(new Set());

  // Load initial announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const { data } = await supabase
          .from('announcements')
          .select('*')
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (data) {
          setAnnouncements(data);
        }
      } catch (err) {
        console.error('Failed to load announcements:', err);
      }
    };

    loadAnnouncements();
  }, []);

  // Subscribe to real-time announcements
  useEffect(() => {
    const channel = supabase
      .channel('public:announcements')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          console.log('New announcement:', payload);
          if (payload.new && payload.new.is_active) {
            setAnnouncements(prev => [payload.new, ...prev].slice(0, 5));
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'announcements' },
        (payload) => {
          if (payload.new) {
            setAnnouncements(prev => 
              prev.map(a => a.id === payload.new.id ? payload.new : a)
            );
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'announcements' },
        (payload) => {
          if (payload.old) {
            setAnnouncements(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissAnnouncement = (id) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'critical':
        return {
          bg: '#fef2f2',
          border: '#dc2626',
          text: '#991b1b',
          icon: 'alert-circle'
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '#f59e0b',
          text: '#92400e',
          icon: 'alert-triangle'
        };
      default:
        return {
          bg: '#eff6ff',
          border: '#3b82f6',
          text: '#1e40af',
          icon: 'info'
        };
    }
  };

  const Icon = ({ type }) => {
    const styles = getTypeStyles(type);
    if (type === 'critical') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.text} strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      );
    }
    if (type === 'warning') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.text} strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={styles.text} strokeWidth="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
    );
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      {visibleAnnouncements.map(announcement => {
        const styles = getTypeStyles(announcement.type);
        return (
          <div
            key={announcement.id}
            style={{
              background: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              <Icon type={announcement.type} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: styles.text, marginBottom: '4px' }}>
                {announcement.title}
              </div>
              <div style={{ fontSize: '14px', color: styles.text, opacity: 0.9 }}>
                {announcement.message}
              </div>
            </div>
            <button
              onClick={() => dismissAnnouncement(announcement.id)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: styles.text,
                opacity: 0.6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default AnnouncementsDisplay;
