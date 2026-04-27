import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects } from '../../services/api';
import './DataEntryDashboard.css';

const ApprovedSubmissions = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch approved projects
                const res = await getProjects({ status: 'approved' });
                const mappedData = res.data.data.map(p => ({
                    id: p.id,
                    name: p.project_name,
                    unit: p.unit_number || 'N/A',
                    owner: 'Unknown',
                    approvedBy: 'Admin',
                    time: new Date(p.created_at).toLocaleTimeString()
                }));
                setSubmissions(mappedData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <button onClick={() => navigate('/data-entry/dashboard')} className="back-link" style={{ marginBottom: 0 }}>
                        ← Back to Dashboard
                    </button>
                    <div className="search-wrapper" style={{ marginLeft: 'auto' }}>
                        <input type="text" placeholder="Search approvals..." className="search-input" />
                        <button className="icon-btn">🔔</button>
                    </div>
                </header>

                <div className="content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '8px' }}>
                                Approved Today
                                <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '0.8rem', padding: '4px 12px', borderRadius: '16px', fontWeight: '600' }}>● Success</span>
                            </h1>
                            <p style={{ color: '#64748b' }}>Wednesday, Oct 25, 2023 • Showing approvals from the last 24 hours</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ background: 'white' }}>▼ Filter</button>
                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⬇ Export List
                            </button>
                        </div>
                    </div>

                    <div className="recent-activity">
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>Project Name</th>
                                    <th>Unit Number</th>
                                    <th>Owner</th>
                                    <th>Approved By</th>
                                    <th>Approval Time</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                                ) : submissions.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No approved submissions found.</td></tr>
                                ) : submissions.map((item, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{item.name}</strong></td>
                                        <td style={{ color: '#10b981', fontWeight: '500' }}>{item.unit}</td>
                                        <td style={{ color: '#64748b' }}>{item.owner}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#e2e8f0', borderRadius: '50%', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.approvedBy.split(' ')[0][0]}{item.approvedBy.split(' ')[1][0]}
                                                </div>
                                                {item.approvedBy}
                                            </div>
                                        </td>
                                        <td style={{ color: '#64748b' }}>{item.time}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn-action" style={{ background: '#2563eb', color: 'white', border: 'none' }} onClick={() => navigate(`/data-entry/submission/${item.id}`)}>View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                            Showing {submissions.length} of {submissions.length} entries approved today
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ApprovedSubmissions;
