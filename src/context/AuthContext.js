/**
 * src/context/AuthContext.js
 * --------------------------
 * Global auth state — wraps the app in Supabase session management.
 * Provides: user, session, loading, signOut
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        // Keep localStorage in sync for axios interceptor
        localStorage.setItem('token', session.access_token);
        const u = session.user;
        localStorage.setItem('user', JSON.stringify({
          id:         u.id,
          email:      u.email,
          first_name: u.user_metadata?.first_name || u.email.split('@')[0],
          last_name:  u.user_metadata?.last_name || '',
          role:       u.user_metadata?.role || 'Admin',
        }));
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session) {
        localStorage.setItem('token', session.access_token);
        const u = session.user;
        localStorage.setItem('user', JSON.stringify({
          id:         u.id,
          email:      u.email,
          first_name: u.user_metadata?.first_name || u.email.split('@')[0],
          last_name:  u.user_metadata?.last_name || '',
          role:       u.user_metadata?.role || 'Admin',
        }));
      } else {
        // Signed out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

export default AuthContext;
