import { useEffect } from 'react';
import API from '../services/api';

const GlobalHeartbeat = () => {
  useEffect(() => {
    const handleHeartbeat = async () => {
      // Use sessionStorage for per-tab session isolation
      const pData = sessionStorage.getItem('company_user');
      const token = sessionStorage.getItem('company_token') || sessionStorage.getItem('token');
      
      if (!pData || !token) return;

      try {
        const u = JSON.parse(pData);
        if (!u.session_id) return;

        const page = window.location.pathname;
        const res = await API.post('/company-auth/heartbeat', {
           session_id: u.session_id, current_page: page 
        }).then(r => r.data).catch(() => null);

        if (res && res.code === 'SESSION_KILLED') {
          console.warn("Session was terminated by admin. Logging out.");
          sessionStorage.clear();
          window.location.href = '/login?reason=session_terminated';
        }
      } catch (e) {
        // ignore JSON parse errors
      }
    };

    // Run heartbeat every 20 seconds
    const interval = setInterval(handleHeartbeat, 20000);
    handleHeartbeat(); // initial check

    return () => clearInterval(interval);
  }, []);

  return null;
};

export default GlobalHeartbeat;
