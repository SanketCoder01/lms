import React from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import './DataEntryDashboard.css';

const ApprovalRequestDetail = () => {
    const navigate = useNavigate();
    // const { id } = useParams(); // Use this to fetch real data in production

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                {/* Breadcrumbs */}
                <div style={{ marginBottom: '24px', color: '#64748b', fontSize: '0.9rem' }}>
                    Home  &gt;  Notifications  &gt;  <span style={{ color: '#2563eb', fontWeight: '500' }}>Approval Request Detail</span>
                </div>

                <div className="approval-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 3fr', gap: '32px', height: 'calc(100vh - 120px)' }}>

                    {/* Inbox Sidebar (Simplified) */}
                    <div className="inbox-sidebar" style={{ background: 'white', borderRadius: '12px', padding: '24px', height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Inbox</h2>
                            <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' }}>3 Unread</span>
                        </div>

                        <div className="inbox-list">
                            <div className="inbox-item active" style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', borderLeft: '3px solid #2563eb', marginBottom: '12px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2563eb' }}>Approval</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>10:45 AM</span>
                                </div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1e293b' }}>Q4 Infrastructure Audit</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Marcus Chen requested approval for the final...</p>
                            </div>

                            <div className="inbox-item" style={{ padding: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#ea580c' }}>System</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Yesterday</span>
                                </div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1e293b' }}>Data Backup Complete</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Global server backup for regional offices...</p>
                            </div>

                            <div className="inbox-item" style={{ padding: '12px', marginBottom: '12px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#16a34a' }}>Project</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Oct 23</span>
                                </div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: '#1e293b' }}>New Milestone Reached</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Phase 1 of TechCorp migration is now complete.</p>
                            </div>
                        </div>
                    </div>

                    {/* Email Content Detail */}
                    <div className="email-content" style={{ background: 'white', borderRadius: '12px', padding: '40px', height: '100%', overflowY: 'auto', position: 'relative' }}>

                        {/* Header */}
                        <div className="email-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', position: 'relative' }}>
                                    <span style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', background: '#22c55e', border: '2px solid white', borderRadius: '50%' }}></span>
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Marcus Chen</h3>
                                        <span style={{ background: '#dbeafe', color: '#2563eb', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>Senior Lead Consultant</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Received: Oct 24, 2023 at 10:45 AM
                                    </div>
                                </div>
                            </div>
                            <div className="actions" style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
                                <button className="icon-btn-simple">🖨️</button>
                                <button className="icon-btn-simple">🔗</button>
                                <button className="icon-btn-simple">🗑️</button>
                            </div>
                        </div>

                        {/* Subject */}
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '32px', color: '#1e293b' }}>
                            Project Approval Request: Q4 Infrastructure Audit
                        </h1>

                        {/* Body */}
                        <div className="email-body" style={{ color: '#334155', lineHeight: '1.7', fontSize: '1rem', marginBottom: '32px' }}>
                            <p>Hello Alex,</p>
                            <p>I have finalized the preliminary assessment for the <strong>Q4 Infrastructure Audit</strong>.<br />
                                We've identified several critical patches required for the London data center which are detailed in the attached brief.</p>
                            <p>Before we move into the execution phase next Monday, I need your formal approval on the budget allocation and the specialized technical resource list. This approval is urgent to ensure we secure the third-party auditors by end of week.</p>
                        </div>

                        {/* Warning Alert */}
                        <div style={{ background: '#fffbeb', borderLeft: '4px solid #fbbf24', padding: '16px', borderRadius: '4px', marginBottom: '32px', display: 'flex', gap: '12px' }}>
                            <div style={{ color: '#d97706', fontSize: '1.2rem' }}>⚠️</div>
                            <div>
                                <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px' }}>Deadline Warning</strong>
                                <span style={{ color: '#b45309', fontSize: '0.9rem' }}>Failure to approve by Friday, 5:00 PM will result in a 2-week delay due to auditor availability.</span>
                            </div>
                        </div>

                        <div className="email-body" style={{ color: '#334155', lineHeight: '1.7', fontSize: '1rem', marginBottom: '32px' }}>
                            <p>Please review the attached document and let me know if you have any questions or require further adjustments to the scope.</p>
                            <p>Best regards,<br />Marcus</p>
                        </div>

                        {/* Attachments */}
                        <div style={{ marginBottom: '40px' }}>
                            <h4 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '16px', fontWeight: '500' }}>Attachments (1)</h4>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '600px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>PDF</div>
                                    <div>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>Audit_Specs_v2_Final.pdf</div>
                                        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>2.4 MB • Updated 2 hours ago</div>
                                    </div>
                                </div>
                                <button style={{ background: 'white', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Download</button>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}>
                                👁 Full Project View
                            </button>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-secondary" style={{ padding: '10px 24px', color: '#334155' }} onClick={() => navigate(-1)}>Reject</button>
                                <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => navigate(-1)}>✓ Approve</button>
                            </div>
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .icon-btn-simple {
                        background: none;
                        border: none;
                        cursor: pointer;
                        font-size: 1.1rem;
                        opacity: 0.6;
                        transition: opacity 0.2s;
                    }
                    .icon-btn-simple:hover { opacity: 1; }
                `}</style>
            </main>
        </div>
    );
};

export default ApprovalRequestDetail;
