import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects, getProjectDashboardStats } from '../../services/api';
import './DataEntryDashboard.css';

const DataEntryDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        pendingProjects: 0,
        pendingApprovals: 0,
        approvedToday: 0,
        rejectedToday: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // Fetch specific projects for the "Recent Activity" table
            // In a real scenario, this would be a specialized API call or filter
            const response = await getProjects({ limit: 5 });
            // Filter or map response to match UI if needed
            if (response.data && response.data.data) {
                setRecentActivity(response.data.data.slice(0, 5));
            }

            // Fetch Stats
            const statsRes = await getProjectDashboardStats();
            setStats(statsRes.data);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        let className = 'status-badge pending';
        if (status === 'approved' || status === 'Active') className = 'status-badge approved';
        if (status === 'rejected') className = 'status-badge rejected';

        return <span className={className}>{status || 'Pending'}</span>;
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-text">
                        <h1>Dashboard Overview</h1>
                    </div>
                    <div className="header-actions">
                        <input type="text" placeholder="Search approvals..." className="search-input" />
                        <button className="icon-btn notification-btn" onClick={() => navigate('/data-entry/notifications')}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card" onClick={() => navigate('/data-entry/pending-projects')}>
                        <div className="stat-icon orange">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Pending Projects</span>
                            <h3 className="stat-value">{stats.pendingProjects || 0}</h3>
                        </div>
                        <span className="stat-trend increasing">+2 this week</span>
                    </div>

                    <div className="stat-card" onClick={() => navigate('/data-entry/pending-approvals')}>
                        <div className="stat-icon blue">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Pending Approvals</span>
                            <h3 className="stat-value">{stats.pendingApprovals || 0}</h3>
                        </div>
                        <span className="stat-trend action-required">Action Required</span>
                    </div>

                    <div className="stat-card" onClick={() => navigate('/data-entry/approved-today')} style={{ cursor: 'pointer' }}>
                        <div className="stat-icon green">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Approved Today</span>
                            <h3 className="stat-value">{stats.approvedToday || 0}</h3>
                        </div>
                        <span className="stat-trend success">Daily Goal Met</span>
                    </div>

                    <div className="stat-card" onClick={() => navigate('/data-entry/rejected-submissions')} style={{ cursor: 'pointer' }}>
                        <div className="stat-card">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Rejected Today</span>
                            <h3 className="stat-value">{stats.rejectedToday || 0}</h3>
                        </div>
                        <span className="stat-trend decreasing">-5% vs yesterday</span>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <section className="recent-activity">
                    <div className="section-header">
                        <div>
                            <h2>Recent Activity</h2>
                            <p>Tracking latest submissions and status updates</p>
                        </div>
                        <button className="btn-secondary">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            Export Report
                        </button>
                    </div>

                    <div className="table-responsive">
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Unit</th>
                                    <th>Submission Date</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.map((project, index) => (
                                    <tr key={project.id || index}>
                                        <td>
                                            <strong>{project.project_name}</strong>
                                        </td>
                                        <td>{project.unit_number || 'N/A'}</td>
                                        <td>{new Date(project.created_at).toLocaleDateString()}</td>
                                        <td><StatusBadge status={project.status} /></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className="btn-action"
                                                onClick={() => navigate(`/data-entry/project/${project.id}`)}
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default DataEntryDashboard;
