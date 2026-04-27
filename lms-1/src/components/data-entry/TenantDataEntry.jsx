import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects, unitAPI, tenantAPI } from '../../services/api'; // Assuming unitAPI exists
import './DataEntryDashboard.css';

const TenantDataEntry = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Asset Context State
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form State

    // Form State
    const [formData, setFormData] = useState({
        legalEntityName: '',
        contactEmail: '',
        phoneNumber: '',
        classification: 'Master Tenant', // 'Master Tenant' or 'Sub-tenant'
        companyRegistrationNumber: '',
        industry: '',
        taxId: ''
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchUnits(selectedProject);
        } else {
            setUnits([]);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const response = await getProjects();
            setProjects(response.data.data || []);
        } catch (error) {
            console.error("Error fetching projects", error);
        }
    };

    const fetchUnits = async (projectId) => {
        try {
            const response = await unitAPI.getUnitsByProject(projectId);
            // API returns { data: [...] }
            setUnits(response.data.data || []);
        } catch (error) {
            console.error("Error fetching units", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        setMessage({ text: '', type: '' });
        if (!selectedProject || !selectedUnit) {
            setMessage({ text: 'Please select a Project and Unit.', type: 'error' });
            return;
        }
        if (!formData.legalEntityName || !formData.contactEmail) {
            setMessage({ text: 'Please fill in required tenant information.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                company_name: formData.legalEntityName,
                contact_person_email: formData.contactEmail,
                contact_person_phone: formData.phoneNumber,
                // classification: formData.classification, // Needs backend support or mapped to 'type'
                unit_ids: [selectedUnit],
                status: 'pending', // Changed from 'pending_approval' to match DB constraints
                // Additional fields mapped from form
                company_registration_number: formData.companyRegistrationNumber || null,
                industry: formData.industry || null,
                tax_id: formData.taxId || null,
            };

            await tenantAPI.createTenant(payload);
            setMessage({ text: 'Tenant submitted for approval!', type: 'success' });
            setTimeout(() => navigate('/data-entry/dashboard'), 2000);
        } catch (error) {
            console.error("Error submitting tenant", error);
            setMessage({ text: 'Failed to submit tenant. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => navigate('/data-entry/dashboard')} className="back-link">
                            ← Back to Dashboard
                        </button>
                    </div>
                </header>

                <div className="content-wrapper" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h1>New Tenant data entry</h1>
                        <p style={{ color: '#64748b' }}>Enter hierarchical data for new tenant approval flow.</p>
                    </div>

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

                    <div className="form-layout-2col">
                        {/* LEFT COLUMN: Asset Context */}
                        <div className="form-section-card" style={{ alignSelf: 'start' }}>
                            <div className="section-header">
                                <span className="icon-marker">📍</span>
                                <h3>Asset Context</h3>
                            </div>

                            <div className="form-group">
                                <label>1. Select Project</label>
                                <select
                                    className="form-select"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select a project...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>2. Select Unit</label>
                                <select
                                    className="form-select"
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    disabled={!selectedProject}
                                >
                                    <option value="">Select a unit...</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.unit_number} ({u.status})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="info-box-blue">
                                <span className="info-icon">ℹ️</span>
                                <p style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                    Selecting a unit will automatically pull historical occupancy data.
                                    Ensure the unit is currently vacant or marked for relocation.
                                </p>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Tenant Information */}
                        <div className="form-section-card">
                            <div className="section-header" style={{ justifyContent: 'space-between' }}>
                                <h3>Tenant Information</h3>
                                <span className="badge-draft">Draft Mode</span>
                            </div>

                            <div className="form-group">
                                <label>Legal Entity / Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Enter the full registered name"
                                    name="legalEntityName"
                                    value={formData.legalEntityName}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Contact Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="tenant@example.com"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        placeholder="+1 (555) 000-0000"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tenant Classification</label>
                                <div className="toggle-group">
                                    <button
                                        className={`toggle-btn ${formData.classification === 'Master Tenant' ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, classification: 'Master Tenant' }))}
                                    >
                                        <span className="check-icon">✔</span> Master Tenant
                                    </button>
                                    <button
                                        className={`toggle-btn ${formData.classification === 'Sub-tenant' ? 'active' : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, classification: 'Sub-tenant' }))}
                                    >
                                        🔗 Sub-tenant
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                                    Master tenants hold the primary lease agreement, while sub-tenants are associated with an existing master lease.
                                </p>
                            </div>

                            {/* Additional Fields Optional */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Registration No.</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        name="companyRegistrationNumber"
                                        value={formData.companyRegistrationNumber}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Industry</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        name="industry"
                                        value={formData.industry}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="form-actions" style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button className="btn-secondary" onClick={() => navigate('/data-entry/dashboard')}>Cancel</button>
                                <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'Submitting...' : 'Submit for Approval ➤'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TenantDataEntry;
