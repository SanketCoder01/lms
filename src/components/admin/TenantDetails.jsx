import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { tenantAPI, FILE_BASE_URL } from '../../services/api';
// Reusing OwnerDetails.css for consistent layout and responsiveness
import './OwnerDetails.css';

const TenantDetails = () => {
    const { id } = useParams();
    const [tenant, setTenant] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await tenantAPI.getTenantById(id);
            setTenant(res.data);
        } catch (err) {
            console.error("Failed to fetch tenant details", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <div style={{ padding: '20px', textAlign: 'center' }}>Loading tenant details...</div>
                </main>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <div style={{ padding: '20px', textAlign: 'center' }}>Tenant not found.</div>
                </main>
            </div>
        );
    }

    return (
        <div className="owner-details-container">
            <Sidebar />
            <div className="owner-details-content">
                {/* Breacrumbs */}
                <div className="breadcrumb" style={{ marginBottom: '20px' }}>
                    <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/tenants">TENANT</Link> &gt; <Link to="/admin/tenants">LIST</Link> &gt; <span className="active">DETAILS</span>
                </div>

                {/* Profile Header */}
                <header className="owner-profile-header">
                    <div className="profile-main">
                        <div className="profile-avatar-large" style={{ backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                            {tenant.company_name?.charAt(0) || 'T'}
                        </div>
                        <div className="profile-info">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {tenant.company_name}
                                <span className="badge-verified" style={{ fontSize: '12px' }}>
                                    {tenant.status === 'active' ? 'Active Tenant' : tenant.status}
                                </span>
                            </h2>
                            <p>ID: #TN-{new Date().getFullYear()}-{tenant.id}</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Link to={`/admin/tenant/edit/${tenant.id}`} className="btn-edit" style={{ textDecoration: 'none' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </Link>
                    </div>
                </header>

                <div className="details-layout">
                    {/* Left Column: Personal Information */}
                    <div className="left-column">
                        <div className="side-card">
                            <h3>Personal Information</h3>

                            <div className="personal-info-row">
                                <div className="info-content">
                                    <label>Full Name</label>
                                    <p>{tenant.contact_person_name || 'N/A'}</p>
                                </div>
                                <div className="info-content">
                                    <label>Email Address</label>
                                    <p>{tenant.contact_person_email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="personal-info-row">
                                <div className="info-content">
                                    <label>Phone Number</label>
                                    <p>{tenant.contact_person_phone || 'N/A'}</p>
                                </div>
                                <div className="info-content">
                                    <label>Date of Birth</label>
                                    <p>N/A</p> {/* Not in DB currently */}
                                </div>
                            </div>

                            <div className="personal-info-row">
                                <div className="info-content">
                                    <label>Occupation</label>
                                    <p>{tenant.industry || 'N/A'}</p>
                                </div>
                                <div className="info-content">
                                    <label>Emergency Contact</label>
                                    <p>N/A</p> {/* Not in DB currently */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Key Terms & Current Lease */}
                    <div className="right-column">
                        {/* Key Terms Card (Blue) */}
                        {/* Key Terms Card (Blue) */}
                        <div className="side-card" style={{ background: '#1e40af', color: 'white' }}>
                            <h3 style={{ color: 'white' }}>Key Terms</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Monthly Rent</label>
                                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                                    {tenant.active_lease ? `₹${parseFloat(tenant.active_lease.monthly_rent).toLocaleString()}` : 'N/A'} <span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.8 }}>({tenant.active_lease?.rent_model === 'Fixed' ? 'Fixed' : 'Variable'})</span>
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>
                                    {tenant.active_lease?.rent_model === 'RevenueShare' ? '+ Revenue Share' : ''}
                                </div>
                            </div>

                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '20px' }}></div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Date of Lease</label>
                                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                        {tenant.active_lease?.lease_start ? new Date(tenant.active_lease.lease_start).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Lockin Date</label>
                                    <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                        {/* Assuming lockin date logic or just showing end date if no lockin specific field */}
                                        {tenant.active_lease?.lease_end ? new Date(tenant.active_lease.lease_end).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', opacity: 0.8, marginBottom: '5px' }}>Area Occupied</label>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {tenant.area_occupied ? parseFloat(tenant.area_occupied).toLocaleString() : '0'} <span style={{ fontSize: '14px', fontWeight: 'normal' }}>Sq. ft</span>
                                </div>
                            </div>
                        </div>

                        {/* Current Lease */}
                        <div className="side-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3>Current Lease</h3>
                                <button style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: '500' }}>View Contract</button>
                            </div>

                            {tenant.units && tenant.units.length > 0 ? (
                                tenant.units.map(unit => (
                                    <div key={unit.id} style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                        <div style={{ width: '150px', height: '100px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img
                                                src={unit.image ? `${FILE_BASE_URL}${unit.image}` : 'https://via.placeholder.com/150'}
                                                alt="Unit"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px 0', fontSize: '16px' }}>{unit.project_name || tenant.active_lease?.project_name} – Unit {unit.unit_number}</h4>
                                            <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>
                                                {tenant.active_lease?.project_location || 'Location N/A'}
                                            </p>

                                            <div style={{ display: 'flex', gap: '30px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '2px' }}>Lease Start:</label>
                                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                                        {tenant.active_lease?.lease_start ? new Date(tenant.active_lease.lease_start).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '2px' }}>Lease End:</label>
                                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                                                        {tenant.active_lease?.lease_end ? new Date(tenant.active_lease.lease_end).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No units assigned.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantDetails;
