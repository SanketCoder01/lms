/**
 * src/context/AuthContext.js
 * --------------------------
 * Global auth state - manages Supabase session for legacy users ONLY.
 * Company users use separate JWT auth stored in sessionStorage per tab.
 * 
 * IMPORTANT: This context does NOT interfere with company user sessions.
 * Company users are authenticated via company_token in sessionStorage.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if this is a company user session (separate auth system)
    const companyToken = sessionStorage.getItem('company_token');
    if (companyToken) {
      // Company user - don't interfere with Supabase auth
      // Read user from sessionStorage instead
      const companyUserStr = sessionStorage.getItem('company_user');
      if (companyUserStr) {
        try {
          const companyUser = JSON.parse(companyUserStr);
          setUser(companyUser);
          setSession({ access_token: companyToken }); // Mock session for compatibility
        } catch (e) {
          console.error('Error parsing company user:', e);
        }
      }
      setLoading(false);
      return; // Don't initialize Supabase auth for company users
    }

    // Legacy Supabase auth for non-company users
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes (only for legacy users)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Don't clear company user session!
      if (sessionStorage.getItem('company_token')) {
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    // Check if company user
    if (sessionStorage.getItem('company_token')) {
      sessionStorage.removeItem('company_token');
      sessionStorage.removeItem('company_user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('company_session_id');
      setUser(null);
      setSession(null);
      return;
    }
    
    // Legacy Supabase sign out
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
