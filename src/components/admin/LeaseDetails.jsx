import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { leaseAPI } from '../../services/api';
import LeaseReport from './LeaseReport';
import './LeaseDetails.css';
import './dashboard.css';

const LeaseDetails = () => {
    const { id } = useParams();
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchLease();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchLease = async () => {
        try {
            setLoading(true);
            const res = await leaseAPI.getLeaseById(id);
            setLease(res.data);
        } catch (err) {
            console.error('Failed to fetch lease:', err);
            setLease(null);
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
        if (!amount) return '₹0.00';
        return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
    if (!lease) return <div style={{ padding: 20 }}>Lease not found</div>;

    const leaseType = lease.lease_type === 'Subtenant lease' ? 'sub_lease' : 'direct';
    const rentModel = lease.rent_model === 'RevenueShare' ? 'revenue_share' : 'fixed';

    const getEffectiveRent = () => {
        let base = parseFloat(lease.monthly_rent || 0);
        if (!lease.escalations || lease.escalations.length === 0) return base;

        const today = new Date();
        // Sort escalations by date ascending
        const sortedEscalations = [...lease.escalations].sort((a, b) => new Date(a.effective_from) - new Date(b.effective_from));

        let currentRent = base;
        for (const esc of sortedEscalations) {
            const fromDate = new Date(esc.effective_from);
            const toDate = esc.effective_to ? new Date(esc.effective_to) : null;

            if (today >= fromDate && (!toDate || today <= toDate)) {
                if (esc.increase_type === 'Fixed Amount') {
                    currentRent = base + parseFloat(esc.value || 0);
                } else if (esc.increase_type === 'Rate Per Sqft') {
                    currentRent = parseFloat(esc.value || 0) * (lease.sub_lease_area_sqft || lease.chargeable_area || 1);
                } else if (esc.increase_type === 'Add Rate Per Sqft' || esc.increase_type === 'Add MG') {
                    currentRent = base + (parseFloat(esc.value || 0) * (lease.sub_lease_area_sqft || lease.chargeable_area || 1));
                } else {
                    currentRent = base * (1 + parseFloat(esc.value || 0) / 100);
                }
                break; // Found the active one
            }
        }
        return currentRent;
    };

    const effectiveRent = getEffectiveRent();

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="breadcrumb" style={{ marginBottom: '16px' }}>
                    <Link to="/admin/dashboard" className="text-muted">HOME</Link> &gt;
                    <Link to="/admin/leases" className="text-muted"> LEASES</Link> &gt;
                    <span className="active"> LEASE #{lease.id}</span>
                </div>

                <div className="details-header">
                    <div className="header-title-section">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1>
                                Lease #{lease.id}
                            </h1>
                            <span className={`status-badge ${lease.status?.toLowerCase() || 'pending'}`}>
                                {lease.status || 'Unknown'}
                            </span>
                            {leaseType === 'sub_lease' && <span className="status-badge" style={{ background: '#ebf8ff', color: '#2b6cb0' }}>Sub Lease</span>}
                        </div>
                        <p className="header-subtitle">Commercial Lease Agreement • {lease.project_name || 'N/A'}</p>
                    </div>
                    <div className="header-actions">
                        <LeaseReport lease={lease} />
                        <Link to={`/admin/edit-lease/${lease.id}`} className="edit-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Edit
                        </Link>
                        {/* Renew button logic could be added here later */}
                        {lease.status === 'Active' && <button className="renew-btn">Renew Lease</button>}
                    </div>
                </div>

                <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                    {/* Tenant Information */}
                    <div className="info-card">
                        <h3 style={{ fontSize: '0.95rem', color: '#718096', marginBottom: '16px' }}>Tenant Information</h3>
                        <div className="tenant-card-content" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                            <div className="avatar-placeholder" style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#ebf8ff', color: '#3182ce', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                {(lease.tenant_name || 'T')[0]}
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#2d3748' }}>{lease.tenant_name || lease.sub_tenant_name || 'Unknown Tenant'}</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>{lease.industry || 'Business Tenant'}</p>
                            </div>
                        </div>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>Primary Contact:</label>
                                <div style={{ fontWeight: 500, color: '#2d3748' }}>{lease.contact_person_name || 'N/A'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>Phone:</label>
                                <div style={{ fontWeight: 500, color: '#2d3748' }}>{lease.contact_person_phone || 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    {/* Unit Details */}
                    <div className="info-card">
                        <h3 style={{ fontSize: '0.95rem', color: '#718096', marginBottom: '16px' }}>Unit Details</h3>
                        <div className="unit-card-content" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
                            <div className="unit-img-placeholder" style={{ width: '80px', height: '60px', borderRadius: '8px', backgroundColor: '#edf2f7', overflow: 'hidden' }}>
                                <img src="https://via.placeholder.com/80x60" alt="Unit" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#2d3748' }}>Unit {lease.unit_number || 'N/A'}</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#718096' }}>{lease.project_name || 'Project'}, {lease.project_location ? lease.project_location.split(',')[0] : ''}</p>
                            </div>
                        </div>

                        <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>Unit Condition:</label>
                                <div style={{ fontWeight: 500, color: '#2d3748' }}>{lease.unit_condition ?
                                    (lease.unit_condition === 'bare_shell' ? 'Bare Shell' :
                                        lease.unit_condition === 'warm_shell' ? 'Warm Shell' :
                                            lease.unit_condition === 'fully_furnished' ? 'Fully Furnished' : 'Commercial')
                                    : 'Commercial Office'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#718096', marginBottom: '4px' }}>Size:</label>
                                <div style={{ fontWeight: 500, color: '#2d3748' }}>{lease.chargeable_area ? parseInt(lease.chargeable_area).toLocaleString() : '0'} sq ft</div>
                            </div>
                        </div>
                    </div>

                    {/* Expiry Status */}
                    <div className="info-card">
                        <h3 style={{ fontSize: '0.95rem', color: '#718096', marginBottom: '16px' }}>Expiry Status</h3>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#2d3748', lineHeight: 1 }}>
                                {lease.days_remaining > 0 ? lease.days_remaining : 0}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#718096' }}>Days Remaining</div>
                        </div>

                        <div className="progress-bar-container" style={{ marginBottom: '16px' }}>
                            <div style={{ width: '100%', height: '8px', backgroundColor: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                    width: lease.lease_start && lease.lease_end
                                        ? `${Math.min(100, Math.max(0, ((new Date() - new Date(lease.lease_start)) / (new Date(lease.lease_end) - new Date(lease.lease_start))) * 100))}%`
                                        : '0%',
                                    height: '100%',
                                    backgroundColor: '#3182ce'
                                }}></div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <div>
                                <span style={{ color: '#718096', marginRight: '4px' }}>Started:</span>
                                <span style={{ fontWeight: 500, color: '#2d3748' }}>{formatDate(lease.lease_start)}</span>
                            </div>
                            <div>
                                <span style={{ color: '#718096', marginRight: '4px' }}>Ends:</span>
                                <span style={{ fontWeight: 500, color: '#2d3748' }}>{formatDate(lease.lease_end)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timeline */}
                <div className="timeline-section">
                    <h3>Lease Timeline</h3>
                    <div className="timeline-track">
                        <div className="timeline-point start">
                            <div className="timeline-label">
                                <span className="date-text">{formatDate(lease.lease_start)}</span>
                                <span className="desc-text">Lease Start</span>
                            </div>
                        </div>
                        {/* We could calculate position dynamically, but for simplicity center 'Today' or adjust logic */}
                        <div className="timeline-point current" style={{
                            left: lease.lease_start && lease.lease_end
                                ? `${Math.min(100, Math.max(0, ((new Date() - new Date(lease.lease_start)) / (new Date(lease.lease_end) - new Date(lease.lease_start))) * 100))}%`
                                : '50%'
                        }}>
                            <div className="current-label-badge">Today</div>
                        </div>
                        <div className="timeline-point end">
                            <div className="timeline-label">
                                <span className="date-text">{formatDate(lease.lease_end)}</span>
                                <span className="desc-text">Expiration</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="financials-row">
                    {/* Rent Breakdown */}
                    <div className="rent-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: '#2d3748', textTransform: 'none', fontWeight: 600, fontSize: '1.1rem' }}>Rent Breakdown</h3>
                            <span style={{ fontSize: '0.85rem', color: '#718096' }}>{lease.billing_frequency || 'Monthly'}</span>
                        </div>

                        <div className="rent-breakdown">
                            <div className="rent-item" style={{ background: '#e0f2fe', padding: '10px', borderRadius: '6px', margin: '-5px -10px 10px', display: 'flex', justifyContent: 'space-between' }}>
                                <label style={{ color: '#0369a1', fontWeight: 600 }}>Currently Effective Rent</label>
                                <span className="amount" style={{ color: '#0369a1', fontWeight: 700 }}>{formatCurrency(effectiveRent)}</span>
                            </div>

                            <div className="rent-item">
                                <label>Original Base Rent</label>
                                <span className="amount" style={{ color: '#718096' }}>{formatCurrency(lease.monthly_rent)}</span>
                            </div>
                            {/* Always show Revenue Share if exists */}
                            {lease.revenue_share_percentage && (
                                <>
                                    <div className="rent-item">
                                        <label>Total Sales Amount (Net/Gross)</label>
                                        <span className="amount">{formatCurrency(lease.monthly_net_sales)}</span>
                                    </div>
                                    <div className="rent-item">
                                        <label>Revenue Share</label>
                                        <span className="amount">{lease.revenue_share_percentage}% of {lease.revenue_share_applicable_on || 'Net Sales'}</span>
                                    </div>
                                </>
                            )}
                            {/* CAM/Service removed from total calculation per user request */}
                            {/* Assuming Tax is calculated or stored? For now, we only show what we have. If tax isn't in DB, omit or calculate example */}
                            {/* <div className="rent-item">
                                <label>Tax (Example 5%)</label>
                                <span className="amount">{formatCurrency((parseFloat(lease.monthly_rent || 0) + parseFloat(lease.cam_charges || 0)) * 0.05)}</span>
                            </div> */}
                        </div>

                        <div className="total-row">
                            <span style={{ color: '#718096', fontWeight: 500 }}>Total Base Payable ({lease.billing_frequency}):</span>
                            {/* CAM removed from total - only base rent */}
                            <span className="total-amount">
                                {formatCurrency(parseFloat(lease.monthly_rent || 0))}
                            </span>
                        </div>
                    </div>

                    {/* Security Deposit & Escalations */}
                    <div className="deposit-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#2d3748', textTransform: 'none', fontWeight: 600, fontSize: '1.1rem', marginBottom: '15px' }}>Security Deposit</h3>
                            <div className="deposit-highlight">
                                <label style={{ fontSize: '0.8rem', color: '#3182ce', fontWeight: 600 }}>Amount Held</label>
                                <span className="deposit-amount">{formatCurrency(lease.security_deposit)}</span>
                            </div>

                            <div className="deposit-details">
                                <div className="deposit-row" style={{ marginBottom: '8px' }}>
                                    <span>Utility Deposit:</span>
                                    <span>{formatCurrency(lease.utility_deposit)}</span>
                                </div>
                            </div>
                        </div>

                        {lease.escalations && lease.escalations.length > 0 && (
                            <div>
                                <h3 style={{ margin: 0, color: '#2d3748', textTransform: 'none', fontWeight: 600, fontSize: '1.1rem', marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>Rent Escalations</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {lease.escalations.map((esc, idx) => (
                                        <div key={idx} style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                            <div style={{ fontWeight: 600, color: '#2d3748', marginBottom: '4px' }}>
                                                {formatDate(esc.effective_from)} to {esc.effective_to ? formatDate(esc.effective_to) : 'Present'}
                                            </div>
                                            <div style={{ color: '#4a5568' }}>
                                                {esc.increase_type}: {esc.value}
                                                {esc.increase_type === 'Percentage' ? '%' : (esc.increase_type === 'Rate Per Sqft' ? ' / sqft' : ' Rs addition')}
                                                {/* Always show % and rev share if applicable */}
                                                {esc.rev_share_value && esc.rev_share_value > 0 && (
                                                    <span style={{ marginLeft: '8px', color: '#059669' }}>| Rev Share: {esc.rev_share_value}%</span>
                                                )}
                                            </div>
                                            <div style={{ color: '#718096', fontSize: '0.75rem', marginTop: '2px' }}>Applies to: {esc.escalation_on === 'mg' ? 'MG Base' : esc.escalation_on === 'revenue_share' ? 'Revenue Share' : esc.escalation_on === 'both' ? 'Both (MG + Rev Share)' : esc.escalation_on}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Uploaded Documents */}
                    <div className="documents-card">
                        <h3 style={{ margin: 0, color: '#2d3748', textTransform: 'none', fontWeight: 600, fontSize: '1.1rem', marginBottom: '15px' }}>Uploaded Documents</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {lease.loi_document_url ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>Letter of Intent (LOI)</span>
                                    </div>
                                    <a href={lease.loi_document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Document</a>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>No LOI document uploaded.</div>
                            )}

                            {lease.agreement_document_url ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>Lease Agreement</span>
                                    </div>
                                    <a href={lease.agreement_document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Document</a>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>No Agreement document uploaded.</div>
                            )}

                            {lease.registration_document_url ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 500 }}>Registration Document</span>
                                    </div>
                                    <a href={lease.registration_document_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182ce', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>View Document</a>
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', padding: '8px 0' }}>No Registration document uploaded.</div>
                            )}
                        </div>
                    </div>
                </div>

            </main >
        </div >
    );
};

export default LeaseDetails;
