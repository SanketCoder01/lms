import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import { leaseAPI } from '../../services/api';
import './leaseManagerNew.css';

const LeaseTrackingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLease = async () => {
            try {
                // Determine if we need to mock or fetch real data
                // For now, try to fetch real data
                const res = await leaseAPI.getLeaseById(id);
                setLease(res.data);
            } catch (err) {
                console.error("Error fetching lease details:", err);
                // Fallback mock data if ID not found or API fails (for demo purposes)
                setLease({
                    id: id,
                    project_name: 'Skyline Tower',
                    unit_number: '405A',
                    tenant_name: 'Nexus Digital Ltd.',
                    lease_start: '2022-01-12',
                    lease_end: '2025-01-11',
                    monthly_rent: 12450,
                    security_deposit: 37350,
                    status: 'active'
                });
            } finally {
                setLoading(false);
            }
        };
        fetchLease();
    }, [id]);

    if (loading) return <LeaseManagerLayout>Loading...</LeaseManagerLayout>;
    if (!lease) return <LeaseManagerLayout>Lease not found</LeaseManagerLayout>;

    // Calculate timeline status
    const today = new Date();
    const startDate = new Date(lease.lease_start);
    const endDate = new Date(lease.lease_end);
    const escalationDate = new Date(startDate);
    escalationDate.setFullYear(startDate.getFullYear() + 1); // Mock 1 year
    const renewalDate = new Date(endDate);
    renewalDate.setMonth(renewalDate.getMonth() - 6); // Mock 6 months before expiry

    const isPassed = (date) => today > date;

    return (
        <LeaseManagerLayout>
            <div className="lease-dashboard-content">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => navigate('/lease/tracking')} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>←</button>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {lease.project_name}, Suite {lease.unit_number}
                                <span className="status-pill active" style={{ background: '#dcfce7', color: '#16a34a', fontSize: '12px' }}>Active</span>
                            </h1>
                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏢 {lease.tenant_name}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📍 4th Floor, Sector 4, City Center</span>
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700' }}>Lease ID</div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>NX-9022-{2024}</div>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: '700', marginTop: '8px' }}>Square Footage</div>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>4,250 sq. ft.</div>
                    </div>
                </div>

                {/* Lifecycle Timeline */}
                <div className="lifecycle-header">
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Lease Lifecycle Timeline</h3>

                    <div className="lifecycle-timeline-container">
                        <div className="lifecycle-line-bg"></div>
                        <div className="lifecycle-steps">
                            <div className="l-step passed">
                                <div className="l-icon-circle">★</div>
                                <span className="l-label">Lease Start</span>
                                <span className="l-date">{startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className={`l-step ${isPassed(escalationDate) ? 'passed' : 'active'}`}>
                                <div className="l-icon-circle">📈</div>
                                <span className="l-label">Escalation Due</span>
                                <span className="l-date">{escalationDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="l-status">{isPassed(escalationDate) ? 'Processed' : 'Due Soon'}</span>
                            </div>
                            <div className="l-step">
                                <div className="l-icon-circle">📅</div>
                                <span className="l-label">Renewal Window</span>
                                <span className="l-date">{renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="l-status">Active Now</span>
                            </div>
                            <div className="l-step">
                                <div className="l-icon-circle">🛑</div>
                                <span className="l-label">Lease Expiry</span>
                                <span className="l-date">{endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="bottom-widgets-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>

                    {/* Financial Terms */}
                    <div className="widget-card" style={{ background: '#fff' }}>
                        <div className="widget-header">
                            Financial Terms
                            <span style={{ marginLeft: 'auto', color: '#3b82f6', cursor: 'pointer' }}>💳</span>
                        </div>
                        <div className="flex-row" style={{ marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Monthly Base Rent</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>${lease.monthly_rent?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex-row" style={{ marginBottom: '12px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Security Deposit</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>${lease.security_deposit?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex-row" style={{ marginBottom: '24px', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Annual Escalation</span>
                            <span style={{ fontWeight: '700', color: '#10b981' }}>3.5% ↑</span>
                        </div>
                        <div className="flex-row" style={{ paddingTop: '16px', borderTop: '1px solid #f1f5f9', fontSize: '13px' }}>
                            <span style={{ color: '#64748b' }}>Next Increase</span>
                            <span style={{ fontWeight: '700', color: '#0f172a' }}>{escalationDate.toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Tenant Profile */}
                    <div className="widget-card" style={{ background: '#fff' }}>
                        <div className="widget-header">
                            Tenant Profile
                            <span style={{ marginLeft: 'auto', color: '#3b82f6', cursor: 'pointer' }}>👤</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontWeight: '700' }}>N</div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{lease.tenant_name}</div>
                                <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b' }}>Technology / SaaS</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>👤</span>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Primary Contact</span>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>Sarah Jenkins</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>✉</span>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Email Address</span>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>s.jenkins@nexusdigital.io</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#94a3b8' }}>📞</span>
                                <div>
                                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Phone Number</span>
                                    <span style={{ fontWeight: '600', color: '#0f172a' }}>+1 (555) 892-4410</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="widget-card" style={{ background: '#fff' }}>
                        <div className="widget-header">
                            Documents
                            <span style={{ marginLeft: 'auto', color: '#3b82f6', cursor: 'pointer' }}>📂</span>
                        </div>
                        <div className="doc-list">
                            <div className="doc-item" style={{ padding: '8px', border: 'none' }}>
                                <div className="doc-info">
                                    <div className="doc-icon pdf" style={{ width: '24px', height: '24px', fontSize: '12px' }}>📄</div>
                                    <div>
                                        <div className="doc-name" style={{ fontSize: '12px' }}>Lease_Agreement_Final.pdf</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>12.4 MB • Jan 10, 2022</div>
                                    </div>
                                </div>
                            </div>
                            <div className="doc-item" style={{ padding: '8px', border: 'none' }}>
                                <div className="doc-info">
                                    <div className="doc-icon pdf" style={{ width: '24px', height: '24px', fontSize: '12px' }}>📄</div>
                                    <div>
                                        <div className="doc-name" style={{ fontSize: '12px' }}>Amendment_01_Parking.pdf</div>
                                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>2.1 MB • Mar 15, 2023</div>
                                    </div>
                                </div>
                            </div>
                            <button style={{ width: '100%', padding: '8px', background: '#eff6ff', color: '#3b82f6', border: '1px dashed #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', marginTop: '12px' }}>
                                + Upload New Document
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Lease Activity */}
                <div className="recent-activity-section" style={{ marginTop: '32px' }}>
                    <div className="section-header" style={{ marginBottom: '16px' }}>
                        <h3>Recent Lease Activity</h3>
                    </div>
                    <div className="activity-list">
                        <div className="activity-item" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <div className="status-icon success" style={{ width: '24px', height: '24px', fontSize: '10px' }}>✓</div>
                            <div className="activity-details">
                                <div className="act-title" style={{ fontSize: '13px', fontWeight: '700' }}>Rent escalation applied successfully</div>
                                <div className="act-desc" style={{ fontSize: '12px' }}>Base rent updated from $12,028 to $12,450 (+3.5%)</div>
                            </div>
                            <div className="time-ago">2 days ago</div>
                        </div>
                        <div className="activity-item" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
                            <div className="status-icon" style={{ background: '#eff6ff', color: '#3b82f6', width: '24px', height: '24px', fontSize: '10px' }}>ℹ</div>
                            <div className="activity-details">
                                <div className="act-title" style={{ fontSize: '13px', fontWeight: '700' }}>Renewal window opened</div>
                                <div className="act-desc" style={{ fontSize: '12px' }}>Automatic notification sent to tenant primary contact</div>
                            </div>
                            <div className="time-ago">Aug 01, 2024</div>
                        </div>
                        <div className="activity-item">
                            <div className="status-icon" style={{ background: '#f1f5f9', color: '#64748b', width: '24px', height: '24px', fontSize: '10px' }}>✎</div>
                            <div className="activity-details">
                                <div className="act-title" style={{ fontSize: '13px', fontWeight: '700' }}>Lease details updated by Alex Sterling</div>
                                <div className="act-desc" style={{ fontSize: '12px' }}>Updated emergency contact information for Nexus Digital Ltd.</div>
                            </div>
                            <div className="time-ago">Jun 15, 2024</div>
                        </div>
                    </div>
                </div>

            </div>
        </LeaseManagerLayout>
    );
};

export default LeaseTrackingDetails;
