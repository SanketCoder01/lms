/**
 * SessionKilledAlert.jsx
 * ----------------------
 * Listens for session kill notifications and displays alert to user.
 * Forces logout when session is terminated by admin.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const SessionKilledAlert = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get company user ID from sessionStorage (per-tab isolation)
    const companyUser = sessionStorage.getItem('company_user');
    if (!companyUser) return;

    let userId;
    try {
      const parsed = JSON.parse(companyUser);
      userId = parsed.id;
    } catch (e) {
      return;
    }

    if (!userId) return;

    // Subscribe to session kill notifications
    const channel = supabase
      .channel(`session_kill:${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'session_kill_notifications' 
        },
        (payload) => {
          console.log('Session kill notification received:', payload);
          if (payload.new && payload.new.company_user_id === userId) {
            setMessage(payload.new.message || 'Your session has been terminated by an administrator.');
            setShowAlert(true);
            
            // Clear sessionStorage and redirect to login after 3 seconds
            setTimeout(() => {
              sessionStorage.removeItem('company_token');
              sessionStorage.removeItem('company_user');
              sessionStorage.removeItem('company_session_id');
              sessionStorage.removeItem('company_modules');
              sessionStorage.removeItem('token');
              sessionStorage.removeItem('user');
              navigate('/login');
            }, 3000);
          }
        }
      )
      .subscribe();

    // Also poll for unseen notifications (fallback)
    const checkNotifications = async () => {
      try {
        const { data } = await supabase
          .from('session_kill_notifications')
          .select('*')
          .eq('company_user_id', userId)
          .eq('seen', false)
          .order('created_at', { ascending: false })
          .limit(1);

        if (data && data.length > 0) {
          setMessage(data[0].message || 'Your session has been terminated by an administrator.');
          setShowAlert(true);
          
          // Mark as seen
          await supabase
            .from('session_kill_notifications')
            .update({ seen: true })
            .eq('id', data[0].id);
          
          // Clear sessionStorage and redirect
          setTimeout(() => {
            sessionStorage.removeItem('company_token');
            sessionStorage.removeItem('company_user');
            sessionStorage.removeItem('company_session_id');
            sessionStorage.removeItem('company_modules');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            navigate('/login');
          }, 3000);
        }
      } catch (err) {
        console.error('Error checking session kill notifications:', err);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkNotifications, 5000);
    checkNotifications(); // Initial check

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [navigate]);

  if (!showAlert) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
          Session Terminated
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '16px', color: '#64748b' }}>
          {message}
        </p>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>
          Redirecting to login in 3 seconds...
        </p>
      </div>
    </div>
  );
};

export default SessionKilledAlert;
