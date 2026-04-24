import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import ReportGenerator from './ReportGenerator';
import './dashboard.css';
import './leases.css';
import { leaseAPI, getProjects, getProjectLocations, filterAPI } from "../../services/api";
import usePermissions from '../../hooks/usePermissions';

const Leases = () => {
    const [searchParams] = useSearchParams();
    const { can } = usePermissions();
    const [leases, setLeases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [leaseStatuses, setLeaseStatuses] = useState([]); // Initialize as empty array
    const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'sub'

    // Filter state managed by a single object
    const [filters, setFilters] = useState({
        status: '',
        project_id: '',
        location: '',
        event: '',
        search: '',
        rent_model: '',
        brand: ''
    });

    const [projects, setProjects] = useState([]);
    const [locations, setLocations] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);

    // Report columns for Leases - All sections (Step 1-5)
    const leaseReportColumns = [
        // Step 1: Basic Info
        { key: 'id', label: 'Lease ID' },
        { key: 'lease_type', label: 'Lease Type' },
        { key: 'status', label: 'Status' },
        // Step 2: Parties
        { key: 'tenant_name', label: 'Tenant Name' },
        { key: 'sub_tenant_name', label: 'Sub-Tenant' },
        { key: 'landlord_name', label: 'Landlord Name' },
        // Step 3: Property
        { key: 'project_name', label: 'Project' },
        { key: 'unit_number', label: 'Unit Number' },
        { key: 'floor', label: 'Floor' },
        { key: 'block_tower', label: 'Block/Tower' },
        { key: 'property_type', label: 'Property Type' },
        { key: 'chargeable_area', label: 'Chargeable Area' },
        { key: 'carpet_area', label: 'Carpet Area' },
        // Step 4: Lease Terms
        { key: 'lease_start', label: 'Start Date' },
        { key: 'lease_end', label: 'End Date' },
        { key: 'tenure_months', label: 'Tenure (Months)' },
        { key: 'rent_commencement_date', label: 'Rent Commencement' },
        { key: 'lockin_period', label: 'Lock-in Period' },
        { key: 'lockin_end_date', label: 'Lock-in End Date' },
        { key: 'rent_free_period', label: 'Rent Free Period' },
        { key: 'rent_free_start', label: 'Rent Free Start' },
        { key: 'rent_free_end', label: 'Rent Free End' },
        // Step 5: Financial
        { key: 'monthly_rent', label: 'Monthly Rent' },
        { key: 'security_deposit', label: 'Security Deposit' },
        { key: 'rent_per_sqft', label: 'Rent/Sq Ft' },
        { key: 'escalation_rate', label: 'Escalation Rate' },
        { key: 'escalation_type', label: 'Escalation Type' },
        { key: 'next_escalation_date', label: 'Next Escalation' },
        { key: 'next_escalation_rent', label: 'Next Escalation Rent' },
        // Additional
        { key: 'fit_out_period', label: 'Fit-out Period' },
        { key: 'fit_out_start', label: 'Fit-out Start' },
        { key: 'fit_out_end', label: 'Fit-out End' },
        { key: 'termination_notice_months', label: 'Termination Notice' },
        { key: 'remarks', label: 'Remarks' },
        { key: 'created_at', label: 'Created Date' }
    ];

    // Effect for initial data fetching and URL param handling
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [projectsRes, locationsRes, leaseStatusesRes] = await Promise.all([
                    getProjects(),
                    getProjectLocations(),
                    filterAPI.getFilterOptions("lease_status")
                ]);

                setProjects(projectsRes.data?.data || []);
                setLocations(locationsRes.data || []);

                if (leaseStatusesRes.data.data.length > 0) {
                    setLeaseStatuses(leaseStatusesRes.data.data.map(t => t.option_value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())));
                }
            } catch (err) {
                console.error('Failed to fetch initial filter data:', err);
            }
        };

        fetchInitialData();

        // Handle URL params
        const filterParam = searchParams.get('filter');
        const statusParam = searchParams.get('status');
        const projectIdParam = searchParams.get('project_id');
        const rentModelParam = searchParams.get('rent_model');
        const brandParam = searchParams.get('brand');
        if (filterParam === 'renewals') setFilters(prev => ({ ...prev, event: '90' })); // Matches Dashboard (Upcoming Renewals - 90 days)
        if (filterParam === 'expiries') setFilters(prev => ({ ...prev, event: '60' })); // Matches Dashboard (Upcoming Expiries - 60 days)
        if (filterParam === 'escalations') setFilters(prev => ({ ...prev, event: 'escalation' }));
        if (statusParam) setFilters(prev => ({ ...prev, status: statusParam })); // Handle status filter
        if (projectIdParam) setFilters(prev => ({ ...prev, project_id: projectIdParam })); // Handle project filter
        if (rentModelParam) setFilters(prev => ({ ...prev, rent_model: rentModelParam })); // Handle rent model filter
        if (brandParam) setFilters(prev => ({ ...prev, brand: brandParam })); // Handle brand filter
    }, [searchParams]);

    // Effect for fetching leases when filters change
    useEffect(() => {
        fetchLeases();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, activeTab]); // Depend on the entire filters object AND activeTab

    const fetchLeases = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filters.status) params.status = filters.status;
            if (filters.project_id) params.project_id = filters.project_id;
            if (filters.location) params.location = filters.location;
            if (filters.event) {
                if (filters.event === 'escalation') {
                    params.upcoming_escalations = true;
                } else {
                    params.expires_in = filters.event;
                }
            }
            if (filters.search) params.search = filters.search;
            if (filters.rent_model) params.rent_model = filters.rent_model;
            if (filters.brand) params.brand = filters.brand;
            params.lease_type = activeTab === 'direct' ? 'Direct lease' : 'Subtenant lease';

            const res = await leaseAPI.getAllLeases(params);

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

            // Client-side filtering because backend prioritizes showing all leases for Dashboard 
            const expType = activeTab === 'direct' ? 'Direct lease' : 'Subtenant lease';
            fetchedLeases = fetchedLeases.filter(l => l.lease_type === expType);

            setLeases(fetchedLeases);
        } catch (err) {
            console.error('Failed to fetch leases:', err);
            setLeases([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '\u20B90.00';
        return `\u20B9${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this lease?')) {
            try {
                await leaseAPI.deleteLease(id);
                setLeases(leases.filter(l => l.id !== id));
            } catch (err) {
                console.error('Failed to delete lease:', err);
                const errorMsg = err.response?.data?.message || 'Failed to delete lease. It may have dependencies.';
                alert(errorMsg);
            }
        }
    };

    /* ================= EXPORT CSV ================= */
    const handleExportCSV = () => {
        if (leases.length === 0) return;
        const headers = ["Lease ID", "Tenant", "Project", "Unit", "Start Date", "End Date", "Monthly Rent", "Status"];
        const rows = leases.map(l => [
            l.id,
            l.tenant_name || l.sub_tenant_name || 'N/A',
            l.project_name || 'N/A',
            l.unit_number || 'N/A',
            formatDate(l.lease_start),
            formatDate(l.lease_end),
            formatCurrency(l.monthly_rent),
            l.status || 'N/A'
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leases_${activeTab}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt; <span className="active">LEASES</span>
                        </div>
                        <h1>Lease Management</h1>
                        <p>View and manage all active lease agreements and contracts.</p>
                    </div>
                    {/* Export and Create Lease buttons */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {can('view', 'leases') ? (
                            <button onClick={handleExportCSV} className="secondary-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Export CSV
                            </button>
                        ) : (
                            <button className="secondary-btn" disabled title="You don't have export permission" style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Export CSV</button>
                        )}
                        {can('view', 'leases') ? (
                            <button onClick={() => setShowReportModal(true)} className="secondary-btn" style={{ background: '#eff6ff', color: '#2e66ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                Generate Report
                            </button>
                        ) : (
                            <button className="secondary-btn" disabled title="You don't have report permission" style={{ background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '4px', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '4px' }}>🔒 Generate Report</button>
                        )}
                        {can('edit', 'leases') ? (
                            <Link to="/admin/add-lease" className="primary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                Create Lease
                            </Link>
                        ) : (
                            <button className="primary-btn" disabled title="You don't have permission to create leases" style={{ opacity: 0.5, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>🔒 Create Lease</button>
                        )}
                    </div>
                </header>

                <div className="content-card">
                    <div className="tabs-container" style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e2e8f0', padding: '0 20px', marginBottom: '20px' }}>
                        <button
                            className={`tab-btn ${activeTab === 'direct' ? 'active' : ''}`}
                            onClick={() => setActiveTab('direct')}
                            style={{ padding: '15px 5px', background: 'none', border: 'none', borderBottom: activeTab === 'direct' ? '2px solid #2e66ff' : '2px solid transparent', color: activeTab === 'direct' ? '#2e66ff' : '#64748b', fontWeight: activeTab === 'direct' ? 600 : 400, cursor: 'pointer', fontSize: '15px' }}
                        >
                            Direct Leases
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'sub' ? 'active' : ''}`}
                            onClick={() => setActiveTab('sub')}
                            style={{ padding: '15px 5px', background: 'none', border: 'none', borderBottom: activeTab === 'sub' ? '2px solid #2e66ff' : '2px solid transparent', color: activeTab === 'sub' ? '#2e66ff' : '#64748b', fontWeight: activeTab === 'sub' ? 600 : 400, cursor: 'pointer', fontSize: '15px' }}
                        >
                            Sub-Leases
                        </button>
                    </div>

                    {/* Filters Bar */}
                    <div className="filters-bar" style={{ padding: '0 20px' }}>
                        <div className="leases-filter-group">
                            <div className="filter-item">
                                <label>Status Filter</label>
                                <div className="select-wrapper">
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="">All Statuses</option>
                                        {leaseStatuses.map((status) => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                    <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>

                            <div className="filter-item">
                                <label>Upcoming Events</label>
                                <div className="select-wrapper">
                                    <select value={filters.event} onChange={(e) => setFilters({ ...filters, event: e.target.value })}>
                                        <option value="">All Events</option>
                                        <option value="30">Expiring in 30 Days</option>
                                        <option value="60">Expiring in 60 Days</option>
                                        <option value="90">Expiring in 90 Days</option>
                                        <option value="escalation">Upcoming Rent Escalations</option>
                                    </select>
                                    <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>


                            <div className="filter-item">
                                <label>Project</label>
                                <div className="select-wrapper">
                                    <select value={filters.project_id} onChange={(e) => setFilters({ ...filters, project_id: e.target.value })}>
                                        <option value="">All Projects</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.project_name}</option>
                                        ))}
                                    </select>
                                    <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>

                            <div className="filter-item">
                                <label>Location</label>
                                <div className="select-wrapper">
                                    <select value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                                        <option value="">All Locations</option>
                                        {locations.map((loc, index) => (
                                            <option key={index} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                    <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                                </div>
                            </div>

                            <div className="filter-item header-search" style={{ flex: 1.5, minWidth: '200px' }}>
                                <div className="search-wrapper" style={{ width: '100%' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    <input
                                        type="text"
                                        placeholder="Search leases..."
                                        value={filters.search}
                                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && fetchLeases()}
                                    />
                                </div>
                            </div>



                        </div>
                    </div>


                    {/* Leases Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Lease ID</th>
                                    <th>Unit</th>
                                    <th>Tenant</th>
                                    <th>Duration</th>
                                    <th>Rent / Month</th>
                                    <th>Deposit</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Loading leases...</td>
                                    </tr>
                                )}
                                {!loading && leases.length === 0 && (
                                    <tr>
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>No leases found.</td>
                                    </tr>
                                )}
                                {!loading && leases.map((lease) => (
                                    <tr key={lease.id}>
                                        <td className="id-cell">
                                            <Link to={`/admin/view-lease/${lease.id}`} style={{ textDecoration: 'none', color: '#2e66ff', fontWeight: 600 }}>
                                                L-{lease.id}
                                            </Link>
                                        </td>
                                        <td>
                                            <div className="cell-stacked">
                                                <span className="primary-text">{lease.unit_number || 'N/A'}</span>
                                                <span className="secondary-text">{lease.project_name || 'Project'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>
                                                    {(lease.tenant_name || 'T')[0]}
                                                </div>
                                                {lease.tenant_name || lease.sub_tenant_name || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell-stacked">
                                                <span className="primary-text">{formatDate(lease.lease_start)}</span>
                                                <span className="secondary-text">to {formatDate(lease.lease_end)}</span>
                                            </div>
                                        </td>
                                        <td>{formatCurrency(lease.monthly_rent)}</td>
                                        <td>{formatCurrency(lease.security_deposit)}</td>
                                        <td>
                                            <span className={`status-badge ${lease.status ? lease.status.toLowerCase() : 'draft'}`}>
                                                {lease.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-icon-wrapper right">
                                                {can('view', 'leases') ? (
                                                    <Link to={`/admin/view-lease/${lease.id}`} className="action-icon-btn view" title="View Details">
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </Link>
                                                ) : (
                                                    <button className="action-icon-btn" disabled title="No view permission" style={{ opacity: 0.4, cursor: 'not-allowed', fontSize: '14px' }}>🔒</button>
                                                )}
                                                {can('edit', 'leases') ? (
                                                    <Link to={`/admin/edit-lease/${lease.id}`} className="action-icon-btn edit" title="Edit">
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </Link>
                                                ) : (
                                                    <button className="action-icon-btn" disabled title="No edit permission" style={{ opacity: 0.4, cursor: 'not-allowed', fontSize: '14px' }}>🔒</button>
                                                )}
                                                {can('delete', 'leases') ? (
                                                    <button className="action-icon-btn delete" onClick={() => handleDelete(lease.id)} title="Delete">
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                ) : (
                                                    <button className="action-icon-btn" disabled title="No delete permission" style={{ opacity: 0.4, cursor: 'not-allowed', fontSize: '14px' }}>🔒</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <span>Showing {leases.length} results</span>
                        <div className="page-nav">
                            <button disabled>&lt;</button>
                            <span>1</span>
                            <button>&gt;</button>
                        </div>
                    </div>

                </div>
            </main >

            {showReportModal && (
                <ReportGenerator
                    title="Leases Report"
                    data={leases}
                    columns={leaseReportColumns}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </div >
    );
};

export default Leases;
