import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { tenantAPI } from '../../services/api';
// Reusing OwnerList.css for consistent styling - assuming generic Dashboard styles are there
// If specific styles are needed, we can create TenantList.css with same content
import './OwnerList.css';

const TenantList = () => {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [location, setLocation] = useState('All');
    const [locations, setLocations] = useState(['All']);

    useEffect(() => {
        fetchLocations();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTenants();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, location]);

    const fetchLocations = async () => {
        try {
            const res = await tenantAPI.getLocations();
            if (res.data) setLocations(['All', ...res.data]);
        } catch (error) {
            console.error("Failed to fetch locations");
        }
    };

    const fetchTenants = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (location && location !== 'All') params.location = location;

            const res = await tenantAPI.getTenants(params);
            // Depending on backend response structure (array or {data: []})
            setTenants(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (error) {
            console.error("Failed to fetch tenants", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this tenant?')) {
            try {
                await tenantAPI.deleteTenant(id);
                setTenants(tenants.filter(t => t.id !== id));
            } catch (error) {
                console.error("Failed to delete tenant", error);
                alert("Failed to delete tenant");
            }
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard">HOME</Link> &gt; <span className="active">TENANT</span>
                        </div>
                        <h1>Tenant List</h1>
                        <p>Manage and view all registered tenants and their current status.</p>
                    </div>
                    <Link to="/admin/tenant/add" className="primary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Add Tenants
                    </Link>
                </header>

                <div className="content-card">
                    {/* Filters Bar */}
                    <div className="filters-bar" style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
                        <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <svg
                                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ position: 'absolute', left: '12px', color: '#64748b' }}
                            >
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search Tenant by name or email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: '#f1f5f9'
                                }}
                            />
                        </div>

                        <button className="clear-btn" style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setSearch(''); setLocation('All'); }}>
                            Clear filters
                        </button>

                        {/* Location Dropdown */}
                        <div className="filter-group" style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                            <select
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}
                            >
                                {locations.map(loc => (
                                    <option key={loc} value={loc}>{loc === 'All' ? 'Location: All' : loc}</option>
                                ))}
                            </select>

                        </div>
                    </div>

                    <div className="owner-table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tenant Name</th>
                                    <th>Contact</th>
                                    <th>Occupied Units</th>
                                    <th>Area Occupied</th>
                                    <th>KYC Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan="6" className="empty-state">Loading tenants...</td></tr>
                                )}
                                {!loading && tenants.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="empty-state">
                                            No tenants found. Click "Add Tenants" to create one.
                                        </td>
                                    </tr>
                                )}
                                {!loading && tenants.map((tenant) => (
                                    <tr key={tenant.id}>
                                        <td>
                                            <div className="owner-info-col">
                                                <div className="owner-details">
                                                    <div className="owner-name" style={{ fontWeight: 600 }}>{tenant.company_name}</div>
                                                    <div className="owner-id" style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #TN-{new Date().getFullYear()}-{tenant.id.toString().padStart(3, '0')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{tenant.contact_person_phone || 'N/A'}</span>
                                                <span style={{ fontSize: '11px', color: '#666' }}>{tenant.contact_person_email}</span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '150px', whiteSpace: 'normal', fontSize: '0.85rem' }}>
                                            {tenant.occupied_units ? tenant.occupied_units : <span style={{ color: '#999' }}>No Units</span>}
                                        </td>
                                        <td style={{ fontWeight: 500 }}>
                                            {tenant.area_occupied ? parseFloat(tenant.area_occupied).toLocaleString() : '0'} sqft
                                        </td>
                                        <td>
                                            <span className={`status-badge ${tenant.kyc_status || 'pending'}`}>
                                                {tenant.kyc_status ? tenant.kyc_status.charAt(0).toUpperCase() + tenant.kyc_status.slice(1) : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                                                <Link to={`/admin/tenant/${tenant.id}`} className="action-btn view" title="View Details">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </Link>
                                                <Link to={`/admin/tenant/edit/${tenant.id}`} className="action-btn edit" title="Edit">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </Link>
                                                <button className="action-btn delete" onClick={() => handleDelete(tenant.id)} title="Delete">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TenantList;
