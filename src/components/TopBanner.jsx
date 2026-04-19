import React, { useEffect, useState } from 'react';
import API from '../services/api';

const TopBanner = () => {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const token = localStorage.getItem('company_token') || localStorage.getItem('token');
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
  }, []);

  if (announcements.length === 0) return null;

  return (
    <div style={{
      background: '#1e3a8a',
      color: 'white',
      padding: '8px 16px',
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        fontWeight: 'bold',
        marginRight: '16px',
        paddingRight: '16px',
        borderRight: '1px solid rgba(255,255,255,0.3)',
        background: '#1e3a8a',
        zIndex: 2,
        position: 'relative'
      }}>
        __ Live Updates
      </div>
      <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'marquee 30s linear infinite' }}>
        {announcements.map((a, i) => (
          <span key={a.id} style={{ marginRight: '50px' }}>
            <strong style={{ opacity: 0.9 }}>{a.title}</strong>: {a.message || a.content}
          </span>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default TopBanner;
