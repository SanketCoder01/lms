import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeaseManagerLayout from './LeaseManagerLayout';
import { leaseAPI } from '../../services/api';
import './leaseManagerNew.css';

const LeaseDetailsManager = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lease, setLease] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showRejectSuccessModal, setShowRejectSuccessModal] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form States
    const [approvalNotes, setApprovalNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [rejectComments, setRejectComments] = useState('');

    useEffect(() => {
        const fetchLease = async () => {
            try {
                const { data } = await leaseAPI.getLeaseById(id);
                setLease(data);
            } catch (error) {
                console.error("Error fetching lease:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLease();
    }, [id]);

    const handleConfirmApprove = async () => {
        try {
            await leaseAPI.approveLease(id);
            setShowApproveModal(false);
            setShowSuccessModal(true);
        } catch (err) {
            setMessage({ text: 'Error approving lease', type: 'error' });
            setShowApproveModal(false); // Close modal to show error on main screen or keep open and show inside? 
            // Better to show on main screen or inside modal. For now, showing on main screen.
        }
    };

    const handleConfirmReject = async () => {
        if (!rejectReason) {
            alert("Please select a rejection reason");
            return;
        }
        try {
            await leaseAPI.rejectLease(id, { reason: rejectReason, comments: rejectComments });
            setShowRejectModal(false);
            setShowRejectSuccessModal(true);
        } catch (err) {
            setMessage({ text: 'Error rejecting lease', type: 'error' });
            setShowRejectModal(false);
        }
    };

    if (loading) return <LeaseManagerLayout>Loading...</LeaseManagerLayout>;
    if (!lease) return <LeaseManagerLayout>Lease not found</LeaseManagerLayout>;

    return (
        <LeaseManagerLayout>
            <div className="lease-dashboard-content" style={{ paddingBottom: '80px' }}>

                {/* Header */}
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <button onClick={() => navigate('/lease/reviews')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                            ← Back to Pending
                        </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                                Lease L-{2024}-{1000 + lease.id}
                                <span className={`status-pill ${lease.status === 'draft' ? 'pending' : lease.status}`} style={{ fontSize: '11px', textTransform: 'uppercase' }}>
                                    {lease.status === 'draft' ? 'Under Review' : lease.status}
                                </span>
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                                Submitted by Marcus Reed on {new Date(lease.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="icon-btn">🖨</button>
                            <button className="icon-btn">🔗</button>
                        </div>
                    </div>
                </div>



                {message.text && (
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto 24px auto',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${message.type === 'success' ? '#166534' : '#991b1b'}`,
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        fontWeight: '500'
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="details-grid">

                    {/* LEFT COLUMN - MAIN CONTENT */}
                    <div className="details-main">

                        {/* 1. General Info */}
                        <div className="details-card">
                            <div className="card-header">
                                <div className="status-icon" style={{ background: '#10b981', width: '20px', height: '20px', fontSize: '10px' }}>✓</div>
                                <h3>General Information</h3>
                            </div>
                            <div className="info-grid-2">
                                <div className="info-item">
                                    <label>Project Name</label>
                                    <p>{lease.project_name}</p>
                                </div>
                                <div className="info-item">
                                    <label>Unit Number</label>
                                    <p>Unit {lease.unit_number} (Building B)</p>
                                </div>
                                <div className="info-item">
                                    <label>Tenant Entity</label>
                                    <p>{lease.tenant_name}</p>
                                </div>
                                <div className="info-item">
                                    <label>Premises Type</label>
                                    <p>Commercial Office - Grade A</p>
                                </div>
                                <div className="info-item">
                                    <label>Area (Rentable)</label>
                                    <p>{lease.chargeable_area} sqft</p>
                                </div>
                                <div className="info-item">
                                    <label>Usage Type</label>
                                    <p>IT & Professional Services</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. Lease Terms */}
                        <div className="details-card">
                            <div className="card-header">
                                <div className="status-icon" style={{ background: '#10b981', width: '20px', height: '20px', fontSize: '10px' }}>📅</div>
                                <h3>Lease Terms</h3>
                            </div>
                            <div className="info-grid-2">
                                <div className="info-item">
                                    <label>Commencement Date</label>
                                    <p>{new Date(lease.lease_start).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
                                </div>
                                <div className="info-item">
                                    <label>Expiry Date</label>
                                    <p>{new Date(lease.lease_end).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</p>
                                </div>
                                <div className="info-item">
                                    <label>Lease Duration</label>
                                    <p>{Math.ceil(lease.tenure_months / 12)} Years ({lease.tenure_months} Months)</p>
                                </div>
                                <div className="info-item">
                                    <label>Renewal Option</label>
                                    <p>1 × 2 Years at Market Rate</p>
                                </div>
                                <div className="info-item">
                                    <label>Termination Notice</label>
                                    <p>{lease.notice_period_months} Months prior to expiry</p>
                                </div>
                                <div className="info-item">
                                    <label>Handover Status</label>
                                    <p>Warm Shell - As Is</p>
                                </div>
                            </div>
                        </div>

                        {/* 3. Financials */}
                        <div className="details-card">
                            <div className="card-header">
                                <div className="status-icon" style={{ background: '#10b981', width: '20px', height: '20px', fontSize: '10px' }}>💵</div>
                                <h3>Financials</h3>
                            </div>

                            <div className="info-grid-3" style={{ marginBottom: '32px' }}>
                                <div className="financial-box">
                                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Base Rent (Monthly)</label>
                                    <div className="amount">${parseInt(lease.monthly_rent).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>$3.50 per sqft</span>
                                </div>
                                <div className="financial-box">
                                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Security Deposit</label>
                                    <div className="amount">${parseInt(lease.security_deposit).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>3 Months Base Rent</span>
                                </div>
                                <div className="financial-box">
                                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: '700' }}>Annual Escalation</label>
                                    <div className="amount">4.5%</div>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Fixed per Year</span>
                                </div>
                            </div>

                            <div className="financial-summary">
                                <div className="financial-summary-row">
                                    <span>Service Charges (Monthly)</span>
                                    <span>$450.00</span>
                                </div>
                                <div className="financial-summary-row">
                                    <span>Utilities Management Fee</span>
                                    <span>$85.00</span>
                                </div>
                                <div className="financial-summary-row">
                                    <span>Parking Stalls (2 units)</span>
                                    <span>$200.00</span>
                                </div>
                                <div className="financial-summary-row" style={{ marginTop: '8px' }}>
                                    <span>Total Monthly Commitment</span>
                                    <span>${(parseInt(lease.monthly_rent) + 450 + 85 + 200).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SIDEBAR */}
                    <div className="details-sidebar">

                        {/* Documents */}
                        <div className="sidebar-section">
                            <h4 className="sidebar-title">Supporting Documents</h4>
                            <div className="doc-list">
                                <div className="doc-item">
                                    <div className="doc-info">
                                        <div className="doc-icon pdf">📄</div>
                                        <div>
                                            <div className="doc-name">Lease_Agreement_Final.pdf</div>
                                        </div>
                                    </div>
                                    <div className="doc-action">⬇</div>
                                </div>
                                <div className="doc-item">
                                    <div className="doc-info">
                                        <div className="doc-icon img">🖼</div>
                                        <div>
                                            <div className="doc-name">Unit_14B_Floorplan.jpg</div>
                                        </div>
                                    </div>
                                    <div className="doc-action">👁</div>
                                </div>
                                <div className="doc-item">
                                    <div className="doc-info">
                                        <div className="doc-icon zip">📦</div>
                                        <div>
                                            <div className="doc-name">KYC_Documents_Pack.zip</div>
                                        </div>
                                    </div>
                                    <div className="doc-action">⬇</div>
                                </div>
                            </div>
                        </div>

                        {/* Review History */}
                        <div className="sidebar-section">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h4 className="sidebar-title" style={{ marginBottom: 0 }}>Review History</h4>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>3 Events</span>
                            </div>

                            <div className="timeline">
                                <div className="timeline-event">
                                    <div className="timeline-dot active"></div>
                                    <div className="timeline-content">
                                        <h4>Review Started</h4>
                                        <p>Today, 10:45 AM by Marcus Reed</p>
                                    </div>
                                </div>
                                <div className="timeline-event">
                                    <div className="timeline-dot passed"></div>
                                    <div className="timeline-content">
                                        <h4>Automatic Compliance Check</h4>
                                        <span className="timeline-status">Passed</span>
                                    </div>
                                </div>
                                <div className="timeline-event">
                                    <div className="timeline-dot passed"></div>
                                    <div className="timeline-content">
                                        <h4>Draft Created</h4>
                                        <p>Aug 12, 04:15 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* FOOTER ACTIONS */}
                {lease.status === 'draft' && (
                    <div className="details-footer">
                        <div style={{ marginRight: 'auto' }}>
                            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>Decision Status</p>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>Pending Manager Approval</p>
                        </div>
                        <button className="btn-reject-red" onClick={() => setShowRejectModal(true)}>Reject Lease</button>
                        <button className="btn-approve-blue" onClick={() => setShowApproveModal(true)}>Approve Lease</button>
                    </div>
                )}


                {/* --- MODALS --- */}

                {/* APPROVE MODAL */}
                {showApproveModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ width: '500px' }}>
                            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                <span className="modal-title" style={{ fontSize: '18px' }}>Approve Lease L-2024-{1000 + lease.id}</span>
                                <button className="close-btn" onClick={() => setShowApproveModal(false)}>×</button>
                            </div>

                            <div className="info-box blue" style={{ marginTop: '16px', background: '#eff6ff', border: '1px solid #dbeafe', color: '#1e40af' }}>
                                <div className="info-box-text" style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                                    <span className="info-icon">ℹ</span>
                                    <span>Approving this lease will move the status to <strong>Active</strong> and notify the tenant entity <strong>{lease.tenant_name}</strong>.</span>
                                </div>
                            </div>

                            <label className="input-label" style={{ marginTop: '20px' }}>Optional Approval Notes</label>
                            <textarea
                                className="modal-textarea"
                                placeholder="Add any final remarks or conditions for this approval..."
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                style={{ height: '100px' }}
                            ></textarea>

                            <div className="modal-actions" style={{ marginTop: '24px' }}>
                                <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>Cancel</button>
                                <button className="btn-confirm-approve" onClick={handleConfirmApprove} style={{ background: '#2563eb' }}>Confirm Approval</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REJECT MODAL */}
                {showRejectModal && (
                    <div className="modal-overlay">
                        <div className="modal-content" style={{ width: '500px' }}>
                            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ background: '#fee2e2', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>!</div>
                                    <span className="modal-title" style={{ fontSize: '18px' }}>Reject Lease Submission</span>
                                </div>
                                <button className="close-btn" onClick={() => setShowRejectModal(false)}>×</button>
                            </div>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '32px', marginBottom: '16px' }}>Lease L-2024-{1000 + lease.id}</p>

                            <label className="input-label">Select Rejection Reason <span style={{ color: 'red' }}>*</span></label>
                            <select className="custom-select" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}>
                                <option value="">Choose a Reason...</option>
                                <option value="Missing Documentation">Missing Documentation</option>
                                <option value="Incorrect Financials">Incorrect Financials</option>
                                <option value="Term Mismatch">Term Mismatch</option>
                                <option value="Other">Other</option>
                            </select>
                            {!rejectReason && <p style={{ color: 'red', fontSize: '11px', marginTop: '4px' }}>Please select a reason</p>}

                            <label className="input-label" style={{ marginTop: '16px' }}>Additional Comments / Instructions for Data Entry</label>
                            <textarea
                                className="modal-textarea"
                                placeholder="Provide specific details about what needs to be corrected..."
                                value={rejectComments}
                                onChange={(e) => setRejectComments(e.target.value)}
                                style={{ height: '100px' }}
                            ></textarea>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>This comment will be visible to Marcus Reed (Submitter).</p>

                            <div className="modal-actions" style={{ marginTop: '24px' }}>
                                <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button className="btn-confirm-reject" onClick={handleConfirmReject} style={{ background: '#ef4444' }}>Confirm Rejection</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUCCESS MODAL (APPROVED) */}
                {showSuccessModal && (
                    <div className="modal-overlay">
                        <div className="modal-content status-modal-content" style={{ textAlign: 'center', width: '400px', padding: '40px' }}>
                            <div style={{ width: '60px', height: '60px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
                                <span style={{ fontSize: '32px', color: '#16a34a' }}>✓</span>
                            </div>

                            <h2 className="status-title" style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Lease Approved Successfully!</h2>
                            <p className="status-desc" style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
                                Lease ID <strong>L-2024-{1000 + lease.id}</strong> has been activated and the tenant has been notified via email.
                            </p>

                            <button className="btn-approve-blue" onClick={() => navigate('/lease/reviews')} style={{ width: '100%', marginBottom: '16px' }}>View Active Lease</button>
                            <span className="status-link" onClick={() => navigate('/lease/dashboard')} style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>Back to Dashboard</span>
                        </div>
                    </div>
                )}

                {/* REJECT SUCCESS MODAL */}
                {showRejectSuccessModal && (
                    <div className="modal-overlay">
                        <div className="modal-content status-modal-content" style={{ textAlign: 'center', width: '400px', padding: '40px' }}>
                            <div style={{ width: '60px', height: '60px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto', border: '4px solid #fecaca' }}>
                                <span style={{ fontSize: '24px', color: '#ef4444' }}>X</span>
                            </div>

                            <h2 className="status-title" style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Lease Submission Rejected</h2>
                            <p className="status-desc" style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' }}>
                                Lease ID <strong>L-2024-{1000 + lease.id}</strong> has been sent back to Marcus Reed for corrections.
                            </p>

                            <button className="btn-reject-red" onClick={() => navigate('/lease/reviews')} style={{ width: '100%', background: '#0f172a', borderColor: '#0f172a', color: '#fff', marginBottom: '16px' }}>Back to Dashboard</button>
                            <span className="status-link" onClick={() => navigate('/lease/reviews')} style={{ fontSize: '13px', color: '#64748b', cursor: 'pointer', fontWeight: '600' }}>View All Pending</span>

                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '24px' }}>🗑 Notification sent to submitter</p>
                        </div>
                    </div>
                )}

            </div>
        </LeaseManagerLayout >
    );
};

export default LeaseDetailsManager;
