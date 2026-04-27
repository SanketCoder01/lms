import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import { leaseAPI } from '../../services/api';
import './leaseManagerNew.css';

const LeaseList = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('pending');
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchLeases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchLeases = async () => {
        setLoading(true);
        try {
            let res;
            if (activeTab === 'pending') {
                // Fetch drafts/pending
                res = await leaseAPI.getAllLeases({ status: 'draft' });
            } else if (activeTab === 'approved') {
                res = await leaseAPI.getAllLeases({ status: 'approved' });
            } else if (activeTab === 'expiring') {
                res = await leaseAPI.getAllLeases({ expires_in: 90 });
            } else {
                res = await leaseAPI.getAllLeases({});
            }
            let fetchedLeases = [];
            if (Array.isArray(res.data)) {
                fetchedLeases = res.data;
            } else if (res.data?.data && Array.isArray(res.data.data)) {
                fetchedLeases = res.data.data;
            } else if (res.data?.leases && Array.isArray(res.data.leases)) {
                fetchedLeases = res.data.leases;
            } else if (res.data?.result && Array.isArray(res.data.result)) {
                fetchedLeases = res.data.result;
            }
            setLeases(fetchedLeases);
        } catch (error) {
            console.error("Error fetching leases:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (id) => {
        navigate(`/lease/review/${id}`);
    };

    const filteredLeases = leases.filter(l =>
        (l.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (l.project_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <LeaseManagerLayout>
            <div className="lease-dashboard-content">
                <header className="page-header-simple">
                    <h1>Leases</h1>
                    <p>Review and approve incoming lease documentation from asset managers.</p>
                </header>

                {/* Tabs */}
                <div className="leases-tabs">
                    <button
                        className={`lease-tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Leases
                    </button>
                    <button
                        className={`lease-tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Review <span className="tab-badge">{activeTab === 'pending' ? leases.length : ''}</span>
                    </button>
                    <button
                        className={`lease-tab ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                    >
                        Approved
                    </button>
                    <button
                        className={`lease-tab ${activeTab === 'expiring' ? 'active' : ''}`}
                        onClick={() => setActiveTab('expiring')}
                    >
                        Expiring Soon
                    </button>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filter-left">
                        <div className="search-bar" style={{ width: '300px', background: '#fff', border: '1px solid #e2e8f0' }}>
                            <input
                                type="text"
                                placeholder="Search tenant, project..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <button className="btn-filter">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                            Filter
                        </button>
                    </div>
                    <div className="filter-right">
                        <span className="showing-text">Showing 1-{filteredLeases.length} of {filteredLeases.length} submissions</span>
                    </div>
                </div>

                {/* Table */}
                <div className="custom-table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Lease ID</th>
                                <th>Project & Unit</th>
                                <th>Tenant Name</th>
                                <th>Lease Period</th>
                                <th>Submitted By</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading...</td></tr>
                            ) : filteredLeases.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center' }}>No leases found</td></tr>
                            ) : (
                                filteredLeases.map((lease) => (
                                    <tr key={lease.id}>
                                        <td><span className="lease-id">L-{2024}-{1000 + lease.id}</span></td>
                                        <td>
                                            <span className="project-name">{lease.project_name || 'N/A'}</span>
                                            <span className="unit-info">Unit {lease.unit_number || '-'} • {lease.chargeable_area || '0'} sqft</span>
                                        </td>
                                        <td><span className="tenant-name">{lease.tenant_name}</span></td>
                                        <td>
                                            <span className="lease-period">
                                                {new Date(lease.lease_start).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} -
                                                {new Date(lease.lease_end).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                            </span>
                                            <span className="lease-term">{lease.tenure_months ? `${Math.ceil(lease.tenure_months / 12)} Year Fixed Term` : '-'}</span>
                                        </td>
                                        <td>
                                            <span className="submitter">Marcus Reed</span> {/* Mock user for now */}
                                            <span className="submit-date">{new Date(lease.created_at || Date.now()).toLocaleDateString()}</span>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${lease.status === 'draft' ? 'pending' : lease.status}`}>
                                                {lease.status === 'draft' ? 'Pending Review' : lease.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-review" onClick={() => handleReview(lease.id)}>
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </LeaseManagerLayout>
    );
};

export default LeaseList;
