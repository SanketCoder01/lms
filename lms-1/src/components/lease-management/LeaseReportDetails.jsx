import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import './leaseManagerNew.css';

const LeaseReportDetails = () => {
    const { reportType } = useParams(); // e.g., 'renewals', 'expired'
    const navigate = useNavigate();

    // Mock Data based on Image 3 (Upcoming Renewals Detailed Report)
    const reportTitle = reportType === 'renewals' ? 'Upcoming Renewals Detailed Report' :
        reportType === 'expired' ? 'Expired Leases Report' : 'Detailed Report';

    const [leases] = useState([
        { id: 101, tenant: 'Abigail Miller', property: 'Skyline Plaza', unit: 'Unit 402 • Commercial', end_date: 'Nov 15, 2023', deadline: 'Oct 28, 2023 ❗', status: 'Critical' },
        { id: 102, tenant: 'Julian Ross', property: 'Emerald Terrace', unit: 'Suite 12A • Residential', end_date: 'Dec 02, 2023', deadline: 'Nov 02, 2023', status: 'Negotiating' },
        { id: 103, tenant: 'TechCore Solutions', property: 'Innovation Hub', unit: 'Fl. 18 • Industrial', end_date: 'Jan 10, 2024', deadline: 'Dec 10, 2023', status: 'Not Started' },
        { id: 104, tenant: 'Lucas Davenport', property: 'Harbor View Apts', unit: 'Unit 809 • Residential', end_date: 'Nov 30, 2023', deadline: 'Oct 31, 2023', status: 'Sent' },
    ]);

    return (
        <LeaseManagerLayout>
            <div className="lease-dashboard-content">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <button onClick={() => navigate('/lease/reports')} style={{ background: 'none', border: 'none', color: '#64748b', marginBottom: '8px', cursor: 'pointer' }}>← Back to Reports</button>
                        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{reportTitle}</h1>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Last updated: Oct 24, 2023 • 09:42 AM</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="white-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📄 Export to Excel</button>
                        <button className="btn-approve-blue" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>📄 Export to PDF</button>
                    </div>
                </div>

                {/* Top KPI Cards (Mocked based on image) */}
                <div className="tracker-stats-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card-clean">
                        <div className="stat-card-title">Total Expiring Soon <span className="badge-trend trend-up" style={{ background: '#eff6ff', color: '#3b82f6' }}>+12% vs last month</span></div>
                        <div className="stat-card-value">24 Leases</div>
                        <div className="stat-card-desc"></div>
                    </div>
                    <div className="stat-card-clean">
                        <div className="stat-card-title">Renewal Pending <span className="badge-trend" style={{ background: '#f1f5f9', color: '#64748b' }}>Normal activity</span></div>
                        <div className="stat-card-value">18</div>
                    </div>
                    <div className="stat-card-clean">
                        <div className="stat-card-title">Avg. Notice Period <span className="badge-trend badge-critical" style={{ background: '#fee2e2', color: '#ef4444' }}>-5% efficiency</span></div>
                        <div className="stat-card-value">45 Days</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <select className="custom-select" style={{ width: '200px' }}><option>Date Range</option></select>
                    <select className="custom-select" style={{ width: '200px' }}><option>Property Type</option></select>
                    <input type="text" className="search-input" placeholder="Search by name..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', width: '300px' }} />
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Clear All</button>
                </div>

                {/* Table */}
                <div className="custom-table-container">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>Tenant Name</th>
                                <th>Property & Unit</th>
                                <th>Lease End Date</th>
                                <th>Renewal Deadline</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leases.map(lease => (
                                <tr key={lease.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#3b82f6' }}>
                                                {lease.tenant.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span style={{ fontWeight: '600', color: '#334155' }}>{lease.tenant}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700', fontSize: '13px', color: '#0f172a' }}>{lease.property}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>{lease.unit}</div>
                                    </td>
                                    <td style={{ fontWeight: '600', color: '#334155' }}>{lease.end_date}</td>
                                    <td style={{ color: lease.status === 'Critical' ? '#ef4444' : '#334155', fontWeight: lease.status === 'Critical' ? '700' : '400' }}>{lease.deadline}</td>
                                    <td>
                                        <span className={`q-pill ${lease.status === 'Critical' ? 'q-urgent' : lease.status === 'Negotiating' ? 'bg-orange-light' : 'q-pending'}`} style={{ color: lease.status === 'Negotiating' ? '#f59e0b' : '' }}>
                                            {lease.status}
                                        </span>
                                    </td>
                                    <td style={{ color: '#94a3b8', cursor: 'pointer' }}>⋮</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: '16px', fontSize: '12px', color: '#64748b' }}>Showing 1 to 4 of 24 results</div>
                </div>

                {/* Pro Tip Alert */}
                <div style={{ marginTop: '24px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '8px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: '#3b82f6', fontSize: '18px' }}>💡</div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e40af', marginBottom: '4px' }}>Pro Tip</div>
                        <div style={{ fontSize: '12px', color: '#1e3a8a', lineHeight: '1.5' }}>Leases marked as <strong style={{ color: '#ef4444' }}>Critical</strong> are within 7 days of their renewal deadline. We recommend reaching out to these tenants immediately to avoid automated month-to-month rollovers.</div>
                    </div>
                </div>

            </div>
        </LeaseManagerLayout>
    );
};

export default LeaseReportDetails;
