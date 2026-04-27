import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import usePermissions from '../../hooks/usePermissions';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { isModuleUser, isProjectUser, hasModuleAccess, projectName } = usePermissions();

    // Read company name dynamically from session (works for all user types)
    const companyName = (() => {
      try {
        const u = JSON.parse(sessionStorage.getItem('user') || '{}');
        return u.company_name || 'Cusec Consulting LLP';
      } catch { return 'Cusec Consulting LLP'; }
    })();


    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Nav item component — hides module if not assigned to this user type
    const NavItem = ({ to, icon, label, moduleKey, onClick }) => {
      const hasAccess = hasModuleAccess(moduleKey);

      // For module/project users: hide completely if not assigned (no lock icon)
      if (!hasAccess && (isModuleUser || isProjectUser)) {
        return null;
      }

      return (
        <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
          <span className="icon">{icon}</span>
          {label}
        </NavLink>
      );
    };

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
            <div className="mobile-toggle" onClick={toggleSidebar}>
                <span></span>
                <span></span>
                <span></span>
            </div>
            <div className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-area">
                        <div className="logo-icon-container">
                            <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="20" cy="20" r="20" fill="#E8F1FF" />
                                <path d="M20 10L10 18V30H16V22H24V30H30V18L20 10Z" fill="#2E66FF" />
                                <path d="M18 14L22 14V16H18V14Z" fill="white" />
                                <path d="M18 18L22 18V20H18V18Z" fill="white" />
                            </svg>
                        </div>
                        <span className="logo-text">{companyName}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {/* 1. Dashboard */}
                    <NavItem 
                      to="/admin/dashboard" 
                      moduleKey="dashboard"
                      label="Dashboard"
                      onClick={() => setIsOpen(false)}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
                    />

                    {/* 2. Filter Options (Masters) — Admin only, never shown to module/project users */}
                    {!isModuleUser && !isProjectUser && (
                      <NavLink to="/admin/filter-options" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}
                        icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>}>
                        <span className="icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg></span>
                        Filter Options
                      </NavLink>
                    )}

                    {/* 3. Projects */}
                    <NavItem 
                      to="/admin/projects" 
                      moduleKey="projects"
                      label={isProjectUser ? (projectName || 'My Project') : 'Projects'}
                      onClick={() => setIsOpen(false)}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 7v14M21 7v14M12 3L3 7l9 4 9-4-9-4z"></path></svg>}
                    />

                    {/* 4. Masters / Parties */}
                    <NavItem 
                      to="/admin/parties" 
                      moduleKey="masters"
                      label="Masters"
                      onClick={() => setIsOpen(false)}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                    />

                    {/* 5. Ownership */}
                    <NavItem 
                      to="/admin/ownership-mapping" 
                      moduleKey="ownership"
                      label="Ownership"
                      onClick={() => setIsOpen(false)}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>}
                    />

                    {/* 6. Leases */}
                    <NavItem 
                      to="/admin/leases" 
                      moduleKey="leases"
                      label="Leases"
                      onClick={() => setIsOpen(false)}
                      icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>}
                    />

                    {/* 7. Role Management - Only for company admins */}
                    {!isModuleUser && !isProjectUser && (
                      <NavLink to="/admin/role-management" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                        <span className="icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </span>
                        Role Management
                      </NavLink>
                    )}

                    {/* 8. Activity Logs - Only for company admins */}
                    {!isModuleUser && !isProjectUser && (
                      <NavLink to="/admin/activity-logs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                        <span className="icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                        </span>
                        Activity Logs
                      </NavLink>
                    )}

                    {/* 9. Settings - Only for company admins */}
                    {!isModuleUser && !isProjectUser && (
                      <NavLink to="/admin/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
                        <span className="icon">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                        </span>
                        Settings
                      </NavLink>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <NavLink to="/logout" className="nav-item logout" onClick={() => setIsOpen(false)}>
                        <span className="icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                        </span>
                        Log Out
                    </NavLink>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
