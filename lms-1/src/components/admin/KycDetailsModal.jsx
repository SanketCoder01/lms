import React from 'react';
import './KycDetailsModal.css';

const KycDetailsModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;

    // Fallback/Mock data if none provided
    const kycData = data || {
        ownerName: "John Doe",
        mobile: "+91 98765 43210",
        email: "johndoe@example.com",
        address: "123, Palm Grove Heights, Mumbai, Maharashtra - 400050",
        docType: "Aadhaar Card",
        docNumber: "XXXX XXXX 1234",
        // Using placeholders for demo; replace with actual image URLs
        docFront: "https://placehold.co/600x400/e2e8f0/1e293b?text=Aadhaar+Front",
        docBack: "https://placehold.co/600x400/e2e8f0/1e293b?text=Aadhaar+Back"
    };

    return (
        <div className="kyc-modal-overlay" onClick={onClose}>
            <div className="kyc-modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <header className="kyc-modal-header">
                    <h3>KYC Document Details</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </header>

                {/* Scrollable Content */}
                <div className="kyc-modal-content">

                    {/* Section 1: Owner Information */}
                    <section className="kyc-section">
                        <h4 className="section-title">Owner Information</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Full Name</label>
                                <p>{kycData.ownerName}</p>
                            </div>
                            <div className="info-item">
                                <label>Mobile Number</label>
                                <p>{kycData.mobile}</p>
                            </div>
                            <div className="info-item">
                                <label>Email ID</label>
                                <p>{kycData.email}</p>
                            </div>
                            <div className="info-item full-width">
                                <label>Address</label>
                                <p>{kycData.address}</p>
                            </div>
                        </div>
                    </section>

                    <div className="divider"></div>

                    {/* Section 2: Document Details */}
                    <section className="kyc-section">
                        <h4 className="section-title">Document Details</h4>
                        <div className="info-grid">
                            <div className="info-item">
                                <label>Document Type</label>
                                <span className="doc-badge">{kycData.docType}</span>
                            </div>
                            <div className="info-item right-align">
                                <label>Document Number</label>
                                <p className="mono-text">{kycData.docNumber}</p>
                            </div>
                        </div>
                    </section>

                    <div className="divider"></div>

                    {/* Section 3: Uploaded Document Preview */}
                    <section className="kyc-section">
                        <h4 className="section-title">Uploaded Document Preview</h4>
                        <div className="document-preview-container">
                            <div className="doc-preview-card">
                                <span className="image-label">Front Side</span>
                                <div className="image-wrapper">
                                    <img src={kycData.docFront} alt="Document Front" />
                                </div>
                            </div>
                            <div className="doc-preview-card">
                                <span className="image-label">Back Side</span>
                                <div className="image-wrapper">
                                    <img src={kycData.docBack} alt="Document Back" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="kyc-modal-footer">
                    <button className="action-btn secondary" onClick={onClose}>Close</button>
                    <div className="admin-actions">
                        <button className="action-btn reject">Reject</button>
                        <button className="action-btn approve">Approve Verified</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default KycDetailsModal;
