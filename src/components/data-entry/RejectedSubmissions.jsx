import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects } from '../../services/api'; // eslint-disable-line no-unused-vars
import './DataEntryDashboard.css';

const RejectedSubmissions = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true); // Loading state

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch projects (simulated for now as per design)
                // const res = await getProjects();  

                // Mock data to match the image requirements
                const mockData = [
                    {
                        id: 1,
                        name: 'Maple Gardens',
                        unit: 'C-110',
                        owner: 'Michael Chen',
                        reason: 'Missing signature on Section 4.2...',
                        time: '10:45 AM'
                    },
                    {
                        id: 2,
                        name: 'Skyline Towers',
                        unit: 'PH-01',
                        owner: 'Sarah Johnson',
                        reason: 'Proof of income document expired...',
                        time: '09:12 AM'
                    },
                    {
                        id: 3,
                        name: 'Blue Oasis',
                        unit: 'G-402',
                        owner: 'David Miller',
                        reason: 'Incorrect security deposit amount...',
                        time: '08:05 AM'
                    },
                ];
                setSubmissions(mockData);
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
                        <input type="text" placeholder="Search rejections..." className="search-input" />
                        <button className="icon-btn">🔔</button>
                    </div>
                </header>

                <div className="content-wrapper">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <div>
                            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.5rem', marginBottom: '8px' }}>
                                Rejected Submissions
                                <span style={{ background: '#fecaca', color: '#ef4444', fontSize: '0.8rem', padding: '4px 12px', borderRadius: '16px', fontWeight: '600' }}>Action Required</span>
                            </h1>
                            <p style={{ color: '#64748b' }}>Friday, October 24, 2023</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ background: 'white' }}>▼ Filter</button>
                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e40af' }}>
                                ℹ View All Issues
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
                                    <th>Reason for Rejection</th>
                                    <th>Rejection Time</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                                ) : submissions.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No rejected submissions found.</td></tr>
                                ) : submissions.map((item, idx) => (
                                    <tr key={idx}>
                                        <td><strong>{item.name}</strong></td>
                                        <td style={{ color: '#2563eb', fontWeight: '500' }}>{item.unit}</td>
                                        <td style={{ color: '#64748b' }}>{item.owner}</td>
                                        <td style={{ color: '#ef4444' }}>{item.reason}</td>
                                        <td style={{ color: '#64748b' }}>{item.time}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button className="btn-action" style={{ background: '#1e40af', color: 'white', border: 'none', padding: '6px 12px' }} onClick={() => navigate(`/data-entry/submission/${item.id}`)}>View Reason</button>
                                                <button className="btn-action" style={{ background: 'transparent', color: '#2563eb', border: '1px solid #2563eb', padding: '6px 12px' }} onClick={() => navigate(`/data-entry/submission/${item.id}`)}>Edit & Resubmit</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ padding: '16px', color: '#94a3b8', fontSize: '0.85rem', borderTop: '1px solid #f1f5f9' }}>
                            Showing {submissions.length} rejected entries from the last 24 hours
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RejectedSubmissions;
