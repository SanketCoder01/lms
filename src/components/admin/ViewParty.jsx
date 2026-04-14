import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { partyAPI } from '../../services/api';
import './ViewParty.css';

const ViewParty = () => {
    const { id } = useParams();
    const [party, setParty] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchParty = async () => {
            try {
                const res = await partyAPI.getPartyById(id);
                setParty(res.data);
            } catch (err) {
                console.error("Error fetching party:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchParty();
    }, [id]);

    if (loading) return <div className="dashboard-container"><Sidebar /><main className="main-content"><p>Loading...</p></main></div>;
    if (!party) return <div className="dashboard-container"><Sidebar /><main className="main-content"><p>Party not found</p></main></div>;

    const displayName = party.type === 'Company' ? party.company_name : `${party.first_name} ${party.last_name}`;

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="view-party-container">
                    <header className="view-party-header">
                        <div className="header-left">
                            <div className="breadcrumb">
                                <Link to="/admin/parties">PARTIES</Link> &gt;
                                <span className="active">{displayName}</span>
                            </div>
                            <h1>{displayName}</h1>
                            <div className="party-badges">
                                <span className={`status-badge ${party.type?.toLowerCase()}`}>{party.type}</span>
                                <span className={`status-badge ${party.party_type?.toLowerCase() || 'neutral'}`}>{party.party_type || 'N/A'}</span>
                            </div>
                        </div>
                        <div className="header-actions">
                            <Link to={`/admin/parties/edit/${party.id}`} className="primary-btn">Edit Party</Link>
                        </div>
                    </header>

                    <div className="party-content">
                        {/* Basic Info */}
                        <section className="info-section">
                            <h3>Basic Information</h3>
                            <div className="info-grid">
                                {party.type === 'Company' && (
                                    <>
                                        <div className="info-item">
                                            <label>Company Name</label>
                                            <span>{party.company_name || '-'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Brand Name</label>
                                            <span>{party.brand_name || '-'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>CIN Number</label>
                                            <span>{party.cin_number || '-'}</span>
                                        </div>
                                    </>
                                )}
                                {party.type === 'Individual' && (
                                    <>
                                        <div className="info-item">
                                            <label>First Name</label>
                                            <span>{party.first_name || '-'}</span>
                                        </div>
                                        <div className="info-item">
                                            <label>Last Name</label>
                                            <span>{party.last_name || '-'}</span>
                                        </div>
                                    </>
                                )}
                                <div className="info-item">
                                    <label>PAN Number</label>
                                    <span>{party.pan_number || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>GST Number</label>
                                    <span>{party.gst_number || '-'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Contact Info */}
                        <section className="info-section">
                            <h3>Contact Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Email</label>
                                    <span>{party.email || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Phone</label>
                                    <span>{party.phone || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Alternate Phone</label>
                                    <span>{party.alt_phone || '-'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Address */}
                        <section className="info-section">
                            <h3>Address</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Address Line 1</label>
                                    <span>{party.address_line1 || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Address Line 2</label>
                                    <span>{party.address_line2 || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>City</label>
                                    <span>{party.city || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>State</label>
                                    <span>{party.state || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Postal Code</label>
                                    <span>{party.postal_code || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Country</label>
                                    <span>{party.country || '-'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Bank Details */}
                        <section className="info-section">
                            <h3>Bank Details</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Bank Name</label>
                                    <span>{party.bank_name || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Account Number</label>
                                    <span>{party.account_number || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>IFSC Code</label>
                                    <span>{party.ifsc_code || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Branch Name</label>
                                    <span>{party.branch_name || '-'}</span>
                                </div>
                            </div>
                        </section>

                        {/* Additional Info */}
                        <section className="info-section">
                            <h3>Additional Information</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>Brand Category</label>
                                    <span>{party.brand_category || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Owner Group</label>
                                    <span>{party.owner_group || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>Remarks</label>
                                    <span>{party.remarks || '-'}</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewParty;
