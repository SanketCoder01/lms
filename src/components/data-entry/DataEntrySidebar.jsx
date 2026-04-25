import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../admin/Sidebar.css';

const DataEntrySidebar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(window.innerWidth > 768);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(true);
            else setIsOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Read company name dynamically from session
    const companyName = (() => {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return u.company_name || 'Cusec Consulting LLP';
      } catch { return 'Cusec Consulting LLP'; }
    })();

    const handleLogout = () => {
        // Use sessionStorage for per-tab session isolation
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('company_token');
        sessionStorage.removeItem('company_user');
        sessionStorage.removeItem('company_session_id');
        navigate('/login');
    };

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {isMobile && (
                <button
                    className="mobile-menu-toggle"
                    onClick={toggleSidebar}
                    style={{
                        position: 'fixed',
                        top: '15px',
                        left: '15px',
                        zIndex: 1001,
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
            )}

            {isMobile && isOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 999
                    }}
                />
            )}

            <div className={`sidebar ${isOpen ? 'open' : 'closed'}`} style={isMobile ? {
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                zIndex: 1000,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease-in-out',
                boxShadow: isOpen ? '4px 0 15px rgba(0,0,0,0.1)' : 'none'
            } : {}}>
                <div className="sidebar-header">
                    <div className="logo-area">
                        <div className="logo-icon-container">
                            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="20" fill="#E8F1FF" />
                                <path d="M20 10L10 18V30H16V22H24V30H30V18L20 10Z" fill="#2E66FF" />
                            </svg>
                        </div>
                        <span className="logo-text">{companyName}</span>
                        {isMobile && (
                            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', marginLeft: 'auto', cursor: 'pointer' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/data-entry/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => isMobile && setIsOpen(false)}>
                        <span className="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        </span>
                        Dashboard
                    </NavLink>

                    <NavLink to="/data-entry/add-data" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => isMobile && setIsOpen(false)}>
                        <span className="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                        </span>
                        Add New Data
                    </NavLink>

                    <NavLink to="/data-entry/past-entries" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => isMobile && setIsOpen(false)}>
                        <span className="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        </span>
                        Past Entries
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="nav-item logout" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <span className="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </span>
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default DataEntrySidebar;
