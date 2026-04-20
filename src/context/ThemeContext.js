/**
 * src/context/ThemeContext.js
 * --------------------------
 * Global theme state - handles light/dark mode for admin panel.
 * Stores preference in Supabase user_settings table with localStorage fallback.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage immediately
    const saved = localStorage.getItem('theme');
    return saved || 'light';
  });
  const [loading, setLoading] = useState(true);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.body.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    document.body.style.color = theme === 'dark' ? '#f1f5f9' : '#0f172a';
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load theme from Supabase on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to get company user ID from sessionStorage (per-tab isolation)
        const companyUserStr = sessionStorage.getItem('company_user');
        if (companyUserStr) {
          const companyUser = JSON.parse(companyUserStr);
          if (companyUser?.id) {
            const { data: settings } = await supabase
              .from('user_settings')
              .select('theme')
              .eq('user_id', String(companyUser.id))
              .single();
            
            if (settings?.theme) {
              setTheme(settings.theme);
            }
          }
        }
      } catch (err) {
        console.log('Using localStorage theme preference');
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Toggle theme and save to Supabase
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    try {
      // Try to save to Supabase
      const companyUserStr = sessionStorage.getItem('company_user');
      if (companyUserStr) {
        const companyUser = JSON.parse(companyUserStr);
        if (companyUser?.id) {
          await supabase
            .from('user_settings')
            .upsert(
              { user_id: String(companyUser.id), theme: newTheme, updated_at: new Date().toISOString() },
              { onConflict: 'user_id' }
            );
        }
      }
    } catch (err) {
      console.log('Theme saved to localStorage only');
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, loading, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

export default ThemeContext;
