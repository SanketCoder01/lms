import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';

const TopBanner = () => {
  const [announcements, setAnnouncements] = useState([]);
  const location = useLocation();

  // Don't show banner for super admin routes or login page
  const isSuperAdminRoute = location.pathname.startsWith('/super-admin') || location.pathname === '/admin';
  const isLoginPage = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/logout';

  useEffect(() => {
    // Skip fetching for super admin or login routes
    if (isSuperAdminRoute || isLoginPage) return;

    const fetchAnnouncements = async () => {
      try {
        // Use sessionStorage for per-tab session isolation
        const token = sessionStorage.getItem('company_token') || sessionStorage.getItem('token');
        if (!token) return;

        const res = await API.get('/company-auth/announcements').then(r => r.data);

        if (res.success && res.announcements) {
          setAnnouncements(res.announcements);
        }
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    fetchAnnouncements();
    const interval = setInterval(fetchAnnouncements, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isSuperAdminRoute, isLoginPage]);

  // Don't render for super admin routes, login page, or no announcements
  if (announcements.length === 0 || isSuperAdminRoute || isLoginPage) return null;

  return (
    <div className="top-banner" style={{
      background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)',
      color: 'white',
      padding: '10px 16px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div className="top-banner-live" style={{
        fontWeight: 'bold',
        marginRight: '16px',
        paddingRight: '16px',
        borderRight: '2px solid rgba(255,255,255,0.3)',
        background: 'rgba(255,255,255,0.1)',
        padding: '4px 12px',
        borderRadius: '4px',
        zIndex: 2,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
        </svg>
        <span className="live-text">LIVE</span>
      </div>
      <div className="top-banner-content" style={{ 
        display: 'inline-block', 
        whiteSpace: 'nowrap', 
        animation: 'marquee 40s linear infinite',
        flex: 1,
        overflow: 'hidden'
      }}>
        {announcements.map((a, i) => (
          <span key={a.id} style={{ marginRight: '80px', display: 'inline-block' }}>
            <strong style={{ 
              opacity: 1, 
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 8px',
              borderRadius: '4px',
              marginRight: '8px'
            }}>
              {a.title}
            </strong> 
            {a.message || a.content}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        body {
          padding-top: 44px !important;
        }
        
        /* Adjust sidebar to start below banner */
        .sidebar {
          top: 44px !important;
          height: calc(100vh - 44px) !important;
          padding-top: 20px !important;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .top-banner {
            padding: 8px 12px !important;
          }
          .top-banner-live {
            margin-right: 8px !important;
            padding: 3px 8px !important;
            font-size: 12px;
          }
          .top-banner-live svg {
            width: 14px !important;
            height: 14px !important;
          }
          .live-text {
            display: none;
          }
          .top-banner-content {
            animation: marquee 25s linear infinite !important;
            font-size: 12px;
          }
          body {
            padding-top: 36px !important;
          }
          .sidebar {
            top: 36px !important;
            height: calc(100vh - 36px) !important;
          }
        }
        
        @media (max-width: 480px) {
          .top-banner-live {
            border-right: none !important;
            padding: 3px 6px !important;
          }
          .top-banner-content {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export default TopBanner;
