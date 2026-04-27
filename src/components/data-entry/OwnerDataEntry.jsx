import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { ownerAPI } from '../../services/api';
import './DataEntryDashboard.css';

const OwnerDataEntry = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        tax_id: '', // GST
        pan_no: '',
        address: '',
        city: 'New York',
        state: '',
        zip: '10001'
    });

    // const handleInputChange = (e) => {
    //     // Simple handler, assuming flat structure for demo
    //     // For nested address, we might need more logic or flatten the state
    //     // Here we just map known fields
    // };

    const handleSubmit = async () => {
        setMessage({ text: '', type: '' });

        if (!formData.name || !formData.email) {
            setMessage({ text: 'Name and Email are required.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                tax_id: formData.tax_id, // Mapping GST to tax_id
                address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
                // ... other fields
            };

            await ownerAPI.createOwner(payload);
            setMessage({ text: 'Owner created successfully!', type: 'success' });
            setTimeout(() => navigate('/data-entry/dashboard'), 2000);
        } catch (error) {
            console.error("Error creating owner", error);
            setMessage({ text: 'Failed to create owner.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                            <span style={{ cursor: 'pointer' }} onClick={() => window.history.back()}>← Back to Dashboard</span>
                        </div>
                        <h1>Manage Owners</h1>
                        <p style={{ color: '#64748b' }}>Search for existing records to update details or create a new profile from scratch for legal compliance.</p>
                    </div>
                </header>

                <div className="search-bar" style={{ marginBottom: '32px' }}>
                    {message.text && (
                        <div style={{
                            marginBottom: '24px',
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
                    <div style={{ position: 'relative' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            type="text"
                            placeholder="Search by Name, Email, or Owner ID..."
                            style={{
                                width: '100%',
                                padding: '12px 16px 12px 48px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* General Information */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#eff6ff', padding: '6px', borderRadius: '6px', color: '#2563eb' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                </span>
                                General Information
                            </h3>
                            <div>
                                <label className="input-label">Owner Full Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jonathan Aris"
                                    className="form-input"
                                    style={{ width: '100%' }}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                                <div>
                                    <label className="input-label">Primary Phone</label>
                                    <input
                                        type="text"
                                        placeholder="+1 (555) 000-0000"
                                        className="form-input"
                                        style={{ width: '100%' }}
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Email Address</label>
                                    <input
                                        type="text"
                                        placeholder="owner@example.com"
                                        className="form-input"
                                        style={{ width: '100%' }}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Tax & Legal */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#eff6ff', padding: '6px', borderRadius: '6px', color: '#2563eb' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                </span>
                                Tax & Legal Compliance
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="input-label">GST Number</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <input
                                            type="text"
                                            placeholder="22AAAAA0000A1Z5"
                                            className="form-input"
                                            style={{ flex: 1 }}
                                            value={formData.tax_id}
                                            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                        />
                                        <button style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '0.75rem' }}>Validate</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">PAN Details</label>
                                    <input
                                        type="text"
                                        placeholder="ABCDE1234F"
                                        className="form-input"
                                        style={{ width: '100%', background: '#f8fafc' }}
                                        value={formData.pan_no}
                                        onChange={(e) => setFormData({ ...formData, pan_no: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#eff6ff', padding: '6px', borderRadius: '6px', color: '#2563eb' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                </span>
                                Primary Address
                            </h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label className="input-label">Street Address</label>
                                <input
                                    type="text"
                                    placeholder="Apartment, suite, unit, building, floor, etc."
                                    className="form-input"
                                    style={{ width: '100%', background: '#f8fafc' }}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="input-label">City</label>
                                    <input
                                        type="text"
                                        placeholder="New York"
                                        className="form-input"
                                        style={{ width: '100%', background: '#f8fafc' }}
                                        value={formData.city}
                                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">State / Province</label>
                                    <input
                                        type="text"
                                        placeholder="State"
                                        className="form-input"
                                        style={{ width: '100%' }}
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="input-label">Zip Code</label>
                                    <input
                                        type="text"
                                        placeholder="10001"
                                        className="form-input"
                                        style={{ width: '100%', background: '#f8fafc' }}
                                        value={formData.zip}
                                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: KYC (Static for now as API doesn't handle files yet easily) */}
                    <div>
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'sticky', top: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ background: '#eff6ff', padding: '6px', borderRadius: '6px', color: '#2563eb' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                </span>
                                KYC Documents
                            </h3>
                            {/* ... (Keep existing static content for KYC for now) ... */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ border: '1px dashed #e2e8f0', borderRadius: '8px', padding: '16px', textAlign: 'center', background: '#f8fafc' }}>
                                    <div style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#2563eb' }}>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                    </div>
                                    <h4 style={{ fontSize: '0.8rem', fontWeight: '600' }}>Identity Proof</h4>
                                    <p style={{ fontSize: '0.7rem', color: '#64748b' }}>Aadhaar, Passport, or DL</p>
                                    <button style={{ marginTop: '8px', color: '#2563eb', fontSize: '0.75rem', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer' }}>Upload File ⊕</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', marginRight: 'auto' }}>Discard Changes</span>
                    <button className="btn-action" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting...' : 'Submit for Approval ➤'}</button>
                </div>

            </main>
        </div>
    );
};

export default OwnerDataEntry;
