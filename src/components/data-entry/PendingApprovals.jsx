import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects } from '../../services/api';
import './DataEntryDashboard.css';

const PendingApprovals = () => {
    const navigate = useNavigate();
    const [approvals, setApprovals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchApprovals = async () => {
            try {
                // In a real app, you might have a different API or status for 'pending_approval'
                const response = await getProjects({ status: 'pending_approval' });
                setApprovals(response.data.data || []);
            } catch (error) {
                console.error("Error fetching approvals", error);
            } finally {
                setLoading(false);
            }
        };

        fetchApprovals();
    }, []);

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <h1>Pending Approvals</h1>
                        <p style={{ color: '#64748b' }}>Wednesday, Oct 25, 2023 • Showing approvals from the last 24 hours</p>
                    </div>
                </header>

                {/* Filter Bar */}
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <select className="filter-select" style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <option>All Projects</option>
                    </select>
                    <select className="filter-select" style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <option>All Users</option>
                    </select>
                    <div className="search-wrapper" style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                        <input type="text" placeholder="Search by unit or user..." className="search-input" style={{ width: '240px' }} />
                        <button className="btn-action" style={{ borderRadius: '6px' }}>▼</button>
                    </div>
                </div>

                <div className="recent-activity" style={{ minHeight: '600px' }}>
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Unit Number</th>
                                <th>Submitted By</th>
                                <th>Submission Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6">Loading...</td></tr> : approvals.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.project_name}</strong></td>
                                    <td>{item.unit_number || 'B-102'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', background: '#cbd5e1', borderRadius: '50%' }}></div>
                                            Sarah Johnson
                                        </div>
                                    </td>
                                    <td>{new Date(item.created_at).toLocaleString()}</td>
                                    <td><span className="status-badge pending">Pending Approval</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-action" onClick={() => navigate(`/data-entry/submission/${item.id}`)}>Review</button>
                                        <button className="btn-secondary" style={{ display: 'inline-flex', marginLeft: '8px', padding: '6px 12px' }}>View</button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && approvals.length === 0 && <tr><td colSpan="6">No pending approvals.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PendingApprovals;
