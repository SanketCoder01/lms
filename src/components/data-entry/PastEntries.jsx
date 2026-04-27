import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects } from '../../services/api';
import './DataEntryDashboard.css';

const PastEntries = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('All Submissions');
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Mock Stats
    const stats = {
        totalPending: 8,
        approvalRate: '94.2%',
        actionRequired: 8
    };

    useEffect(() => {
        // Fetch logic would typically filter by status or fetch all and filter frontend
        // For now, fetching all projects as a proxy for submissions
        const fetchData = async () => {
            try {
                const res = await getProjects();
                // Mocking some extra data for the UI
                const data = res.data.data.map((p, idx) => ({
                    id: p.id || 8821 - idx, // Fallback ID if missing
                    property: p.project_name,
                    subtitle: p.location || 'Unit 402, North Wing',
                    type: p.project_type || 'Lease Agreement',
                    submitted: new Date(p.created_at).toLocaleDateString(),
                    status: p.status === 'active' ? 'Approved' : (p.status === 'rejected' ? 'Rejected' : 'Pending'),
                    rejectionReason: p.status === 'rejected' ? 'Missing signature on page 4.' : null
                }));
                // Ensure we have some data even if API returns empty
                if (data.length === 0) {
                    const mockData = [
                        { id: 8821, property: 'Grandview Apartments', subtitle: 'Unit 402, North Wing', type: 'Lease Agreement', submitted: 'Oct 24, 2023', status: 'Rejected', rejectionReason: 'Missing official signature on page 4 and appendix B. Please re-scan with all required stamps.' },
                        { id: 8819, property: 'Sunset Plaza', subtitle: 'Retail Suite 9', type: 'Maintenance', submitted: 'Oct 23, 2023', status: 'Pending' },
                        { id: 8815, property: 'Oakwood Heights', subtitle: 'Building C-2', type: 'Financial Report', submitted: 'Oct 22, 2023', status: 'Rejected', rejectionReason: 'Incorrect document format.' },
                        { id: 8810, property: 'Harbor View', subtitle: 'Suite 800', type: 'Lease Agreement', submitted: 'Oct 21, 2023', status: 'Approved' },
                    ];
                    setSubmissions(mockData);
                } else {
                    setSubmissions(data);
                }
            } catch (err) {
                console.error(err);
                // Fallback mock data on error
                const mockData = [
                    { id: 8821, property: 'Grandview Apartments', subtitle: 'Unit 402, North Wing', type: 'Lease Agreement', submitted: 'Oct 24, 2023', status: 'Rejected', rejectionReason: 'Missing official signature on page 4 and appendix B. Please re-scan with all required stamps.' },
                    { id: 8819, property: 'Sunset Plaza', subtitle: 'Retail Suite 9', type: 'Maintenance', submitted: 'Oct 23, 2023', status: 'Pending' },
                    { id: 8815, property: 'Oakwood Heights', subtitle: 'Building C-2', type: 'Financial Report', submitted: 'Oct 22, 2023', status: 'Rejected', rejectionReason: 'Incorrect document format.' },
                    { id: 8810, property: 'Harbor View', subtitle: 'Suite 800', type: 'Lease Agreement', submitted: 'Oct 21, 2023', status: 'Approved' },
                ];
                setSubmissions(mockData);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredSubmissions = submissions.filter(s => {
        if (activeTab === 'All Submissions') return true;
        if (activeTab === 'Pending Review') return s.status === 'Pending' || s.status === 'pending_approval';
        if (activeTab === 'Approved') return s.status === 'Approved';
        if (activeTab === 'Rejected') return s.status === 'Rejected';
        return true;
    });

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1>Submission Tracking</h1>
                        <div className="search-wrapper">
                            <input type="text" placeholder="Search by ID, property or type..." className="search-input" style={{ width: '320px' }} />
                        </div>
                    </div>
                    <div className="header-actions">
                        <div className="user-profile-sm">
                            <div className="avatar-circle">AR</div>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '32px' }}>
                    <div className="stat-card" style={{ minHeight: '100px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
                        <div className="stat-icon blue" style={{ marginBottom: 0 }}>📊</div>
                        <div>
                            <div className="stat-label">Total Pending</div>
                            <div className="stat-value">{stats.totalPending} <span style={{ fontSize: '0.9rem', color: '#16a34a', fontWeight: '500' }}>24%</span></div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ minHeight: '100px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
                        <div className="stat-icon green" style={{ marginBottom: 0 }}>✓</div>
                        <div>
                            <div className="stat-label">Approval Rate</div>
                            <div className="stat-value">{stats.approvalRate} <span style={{ fontSize: '0.9rem', color: '#dc2626', fontWeight: '500' }}>-2.1%</span></div>
                        </div>
                    </div>
                    <div className="stat-card" style={{ minHeight: '100px', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
                        <div className="stat-icon red" style={{ marginBottom: 0 }}>⚠️</div>
                        <div>
                            <div className="stat-label">Action Required</div>
                            <div className="stat-value">{stats.actionRequired} <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>Stable</span></div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', gap: '32px' }}>
                    {['All Submissions', 'Pending Review', 'Approved', 'Rejected'].map(tab => (
                        <div
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 0',
                                cursor: 'pointer',
                                color: activeTab === tab ? '#2563eb' : '#64748b',
                                borderBottom: activeTab === tab ? '2px solid #2563eb' : 'none',
                                fontWeight: activeTab === tab ? '600' : '500'
                            }}
                        >
                            {tab}
                        </div>
                    ))}
                    <div style={{ marginLeft: 'auto', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <span>Reference Filter</span> ▼
                    </div>
                </div>

                {/* Table */}
                <div className="recent-activity">
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Property Name</th>
                                <th>Type</th>
                                <th>Submitted</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6">Loading...</td></tr> : filteredSubmissions.map((item) => (
                                <tr key={item.id}>
                                    <td style={{ color: '#64748b' }}>#SUB-{item.id}</td>
                                    <td>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.property}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.subtitle}</div>
                                    </td>
                                    <td>
                                        <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td>{item.submitted}</td>
                                    <td>
                                        {item.status === 'Rejected' ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="status-badge rejected">Rejected</span>
                                                <span style={{ color: '#64748b', cursor: 'pointer' }} title={item.rejectionReason}>💬</span>
                                            </div>
                                        ) : (
                                            <span className={`status-badge ${item.status === 'Approved' ? 'approved' : 'pending'}`}>
                                                {item.status === 'Approved' ? 'Approved' : 'Pending Approval'}
                                            </span>
                                        )}
                                        {item.status === 'Rejected' && item.rejectionReason && (
                                            <div className="reason-tooltip" style={{ marginTop: '8px', fontSize: '0.8rem', color: '#dc2626', maxWidth: '300px' }}>
                                                {item.rejectionReason}
                                                <div style={{ fontSize: '0.7em', color: '#64748b', marginTop: '4px' }}>Rejected by Admin R. Chen</div>
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        {item.status === 'Rejected' ? (
                                            <button className="btn-action" style={{ background: '#2563eb' }}>Re-submit</button>
                                        ) : (
                                            <button
                                                onClick={() => navigate(`/data-entry/submission/${item.id}`)}
                                                style={{ background: 'none', border: 'none', color: '#0f766e', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                View Details
                                            </button>
                                        )}
                                        <div style={{ marginTop: '4px' }}>
                                            {item.status === 'Rejected' && (
                                                <button
                                                    onClick={() => navigate(`/data-entry/submission/${item.id}`)}
                                                    style={{ background: 'none', border: 'none', color: '#0f766e', fontSize: '0.8rem', cursor: 'pointer' }}
                                                >
                                                    View Details
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '16px', color: '#64748b', fontSize: '0.85rem' }}>
                        Showing {filteredSubmissions.length} submissions
                    </div>
                </div>

            </main>
        </div>
    );
};

export default PastEntries;
