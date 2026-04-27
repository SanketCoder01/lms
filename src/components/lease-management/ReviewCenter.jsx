import React, { useEffect, useState } from "react";
import RepSidebar from "../management-rep/RepSidebar";
import "./leaseManagement.css";
import { leaseAPI } from "../../services/api";

const ReviewCenter = () => {
    const [stats, setStats] = useState({
        projects: 3,
        units: 12,
        owners: 1,
        tenants: 4,
        leases: 27 // Matches design
    });
    const [activeTab, setActiveTab] = useState('Lease');
    const [pendingItems, setPendingItems] = useState([]);

    useEffect(() => {
        // Fetch real stats in production, mocking for design match
        leaseAPI.getLeaseDashboardStats().then(res => {
            // Merge with placeholders if needed, or use real data
            setStats(prev => ({ ...prev, leases: res.data.pending_approvals || 27 }));
        }).catch(err => console.error(err));

        // Fetch items
        if (activeTab === 'Lease') {
            leaseAPI.getPendingLeases().then(res => setPendingItems(res.data)).catch(console.error);
        } else {
            setPendingItems([]);
        }
    }, [activeTab]);

    // formatting helper
    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <div className="dashboard-container">
            <RepSidebar />
            <main className="main-content review-center">
                <header className="page-header review-center-header">
                    <div>
                        <h1>Review center</h1>
                        <p>Manage and approve pending submission from data entry. you have {stats.leases} items pending</p>
                    </div>
                </header>

                <div className="review-stats-grid">
                    <div className="review-stat-card">
                        <h4>Projects</h4>
                        <div className="value">{stats.projects}</div>
                    </div>
                    <div className="review-stat-card">
                        <h4>Units</h4>
                        <div className="value">{stats.units}</div>
                    </div>
                    <div className="review-stat-card">
                        <h4>Owners</h4>
                        <div className="value">{stats.owners}</div>
                    </div>
                    <div className="review-stat-card">
                        <h4>Tentant</h4>
                        <div className="value">{stats.tenants}</div>
                    </div>
                </div>

                <div className="review-tabs">
                    {['Project', 'Units', 'Owners', 'Tetant', 'Lease'].map(tab => (
                        <button
                            key={tab}
                            className={`review-tab ${activeTab === (tab === 'Tetant' ? 'Tenant' : tab) ? 'active' : ''}`} // Handle typo in design "Tetant" -> "Tenant" logic
                            onClick={() => setActiveTab(tab === 'Tetant' ? 'Tenant' : tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="approval-list">
                    <h3>Pending {activeTab.toLowerCase()} approvals</h3>

                    <div>
                        {pendingItems.length > 0 ? pendingItems.map((item, i) => (
                            <div className="approval-card-item" key={i}>
                                <div className="approval-card-main">
                                    <div className="approval-header">
                                        <span className="approval-id">ID: #P-{1000 + item.id}</span>
                                        <span className="approval-subtitle">{item.project_name || "Sunset Apartments"}</span>
                                    </div>

                                    <div className="approval-details-grid">
                                        <div className="detail-item">
                                            <label>TENTENT</label>
                                            <span>{item.tenant_name || "Raj Pawar"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>TERM</label>
                                            <span>12 month</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>MONTHLY RENT</label>
                                            <span>₹{item.monthly_rent || "12,000"}</span>
                                        </div>
                                        <div className="detail-item">
                                            <label>START DATE</label>
                                            <span>{formatDate(item.lease_start) || "1 Nov 2023"}</span>
                                        </div>
                                    </div>

                                    <div className="approval-footer">
                                        submitted by <span>john jou</span> on 12 nov 2023
                                    </div>
                                </div>

                                <div className="approval-actions">
                                    <div className="action-buttons">
                                        <button className="btn-reject">REJECT</button>
                                        <button
                                            className="btn-approve-action"
                                            onClick={() => leaseAPI.approveLease(item.id).then(() => window.location.reload())}
                                        >
                                            Approve
                                        </button>
                                    </div>
                                    <textarea className="note-input" placeholder="Add Note"></textarea>
                                </div>
                            </div>
                        )) : (
                            <div className="empty-state">
                                <p>No pending {activeTab.toLowerCase()} items.</p>
                            </div>
                        )}
                    </div>
                    <div className="see-all-container">
                        <button className="btn-see-all">See all</button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ReviewCenter;
