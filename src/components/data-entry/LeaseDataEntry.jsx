import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects, unitAPI, tenantAPI, leaseAPI } from '../../services/api';
import './DataEntryDashboard.css';

const LeaseDataEntry = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Context Selection
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);

    const [selectedProject, setSelectedProject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [selectedTenant, setSelectedTenant] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        leaseStart: '',
        leaseEnd: '',
        tenureMonths: 48,
        gracePeriodDays: 15,
        monthlyBaseRent: 4500.00,
        securityDeposit: 13500.00,
        camCharges: 2.50,
        currency: 'USD',
        escalationRate: 5.0,
        escalationFixed: 0.00,
        nextEscalationDate: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchTenants(); // In real app, might fetch tenants associated with project
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchUnits(selectedProject);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchUnits = async (pid) => {
        try {
            const res = await unitAPI.getUnitsByProject(pid);
            setUnits(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchTenants = async () => {
        try {
            const res = await tenantAPI.getTenants({ limit: 100 }); // Simplified
            setTenants(res.data.data || res.data || []);
        } catch (err) { console.error(err); }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setMessage({ text: '', type: '' });
        if (!selectedProject || !selectedUnit || !selectedTenant) {
            setMessage({ text: 'Please select Project, Unit, and Tenant context.', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            const payload = {
                project_id: selectedProject,
                unit_id: selectedUnit,
                tenant_id: selectedTenant,
                owner_id: 1, // Mock owner for Direct lease requirement or fetch from unit relation
                lease_type: 'Direct lease',
                lease_start: formData.leaseStart,
                lease_end: formData.leaseEnd,
                rent_commencement_date: formData.leaseStart,
                monthly_rent: formData.monthlyBaseRent,
                security_deposit: formData.securityDeposit,
                cam_charges: formData.camCharges,
                currency_code: formData.currency,
                escalations: [
                    {
                        effective_from: formData.nextEscalationDate,
                        increase_type: formData.escalationFixed > 0 ? 'Fixed Amount' : 'Percentage',
                        value: formData.escalationFixed > 0 ? formData.escalationFixed : formData.escalationRate
                    }
                ],
                status: 'draft' // Initial status as per requirements for approval flow
            };

            await leaseAPI.createLease(payload);
            setMessage({ text: 'Lease drafted successfully! Submitted for review.', type: 'success' });
            setTimeout(() => navigate('/data-entry/dashboard'), 2000);
        } catch (error) {
            console.error("Error creating lease:", error);
            setMessage({ text: "Failed to submit lease: " + (error.response?.data?.message || error.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <button onClick={() => navigate('/data-entry/dashboard')} className="back-link">
                        ← Back to Dashboard
                    </button>
                    <div style={{ float: 'right', display: 'flex', gap: '12px' }}>
                        <div className="search-wrapper">
                            <input type="text" placeholder="Search leases, units..." className="search-input" />
                        </div>
                        <div className="user-profile-sm">
                            <div className="avatar-circle">AR</div>
                            <div className="user-info">
                                <span className="name">Alex Rivera</span>
                                <span className="role">Property Manager</span>
                            </div>
                        </div>
                    </div>
                </header>

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

                <div style={{ marginBottom: '24px', color: '#64748b' }}>
                    Project:
                    <select className="inline-select" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                        <option value="">Select Project</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                    / Unit:
                    <select className="inline-select" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                        <option value="">Select Unit</option>
                        {units.map(u => <option key={u.id} value={u.id}>{u.unit_number}</option>)}
                    </select>
                    / Tenant:
                    <select className="inline-select" value={selectedTenant} onChange={(e) => setSelectedTenant(e.target.value)}>
                        <option value="">Select Tenant</option>
                        {tenants.map(t => <option key={t.id} value={t.id}>{t.company_name}</option>)}
                    </select>
                </div>

                <div className="page-title-box">
                    <h1>Lease Data Entry</h1>
                    <p>Configure contractual, financial, and escalation terms for the active lease.</p>
                </div>

                <div className="data-entry-grid">
                    <div className="left-panel">
                        {/* Contract Details */}
                        <div className="form-section-card">
                            <div className="section-header">
                                <span className="icon-marker">📅</span>
                                <h3>Contract Details</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Lease Start Date</label>
                                    <input type="date" className="form-input" name="leaseStart" value={formData.leaseStart} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Lease End Date</label>
                                    <input type="date" className="form-input" name="leaseEnd" value={formData.leaseEnd} onChange={handleInputChange} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tenure (Months)</label>
                                    <input type="number" className="form-input" name="tenureMonths" value={formData.tenureMonths} onChange={handleInputChange} readOnly style={{ background: '#f8fafc' }} />
                                </div>
                                <div className="form-group">
                                    <label>Grace Period (Days)</label>
                                    <input type="number" className="form-input" name="gracePeriodDays" value={formData.gracePeriodDays} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        {/* Financial Terms */}
                        <div className="form-section-card">
                            <div className="section-header">
                                <span className="icon-marker">💶</span>
                                <h3>Financial Terms</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Monthly Base Rent</label>
                                    <div className="input-group">
                                        <span className="prefix">$</span>
                                        <input type="number" className="form-input" name="monthlyBaseRent" value={formData.monthlyBaseRent} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Security Deposit</label>
                                    <div className="input-group">
                                        <span className="prefix">$</span>
                                        <input type="number" className="form-input" name="securityDeposit" value={formData.securityDeposit} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>CAM Charges (per sqft)</label>
                                    <div className="input-group">
                                        <span className="prefix">$</span>
                                        <input type="number" className="form-input" name="camCharges" value={formData.camCharges} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Currency</label>
                                    <select className="form-select" name="currency" value={formData.currency} onChange={handleInputChange}>
                                        <option value="USD">USD - Dollar</option>
                                        <option value="INR">INR - Rupee</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Escalation Terms */}
                        <div className="form-section-card">
                            <div className="section-header">
                                <span className="icon-marker">📈</span>
                                <h3>Escalation Terms</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Annual Increase (%)</label>
                                    <input type="number" className="form-input" name="escalationRate" value={formData.escalationRate} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Fixed Amount ($)</label>
                                    <input type="number" className="form-input" name="escalationFixed" value={formData.escalationFixed} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label>Next Escalation Date</label>
                                    <input type="date" className="form-input" name="nextEscalationDate" value={formData.nextEscalationDate} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <button className="btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Processing...' : 'Submit Lease Logic ➤'}
                            </button>
                        </div>
                    </div>

                    <div className="right-panel">
                        {/* Lease Summary Card */}
                        <div className="summary-card-blue">
                            <h3>Lease Summary</h3>
                            <div className="summary-row">
                                <span>Total Contract Value</span>
                                <strong>$216,000.00</strong>
                            </div>
                            <div className="summary-row">
                                <span>Avg. Monthly Yield</span>
                                <strong>$4,500.00</strong>
                            </div>
                            <div className="risk-indicator">
                                <span>Risk Rating</span>
                                <span className="badge-low-risk">Low Risk</span>
                            </div>
                        </div>

                        {/* Documentation Upload */}
                        <div className="upload-card">
                            <div className="section-header">
                                <span className="icon-marker">📄</span>
                                <h3>Documentation</h3>
                            </div>
                            <div className="upload-box-dashed">
                                <div className="upload-icon">☁️</div>
                                <p><strong>Upload Lease Agreement</strong></p>
                                <p className="sub-text">Drag and drop PDF, DOCX (Max 10MB)</p>
                            </div>
                            <div className="file-list">
                                <div className="file-item">
                                    <span className="file-icon-pdf">PDF</span>
                                    <span className="file-name">Executed_Lease_TF.pdf</span>
                                    <button className="btn-close">×</button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="activity-card">
                            <h3>Recent Activity</h3>
                            <ul className="activity-timeline">
                                <li>
                                    <span className="dot"></span>
                                    <div className="timeline-content">
                                        <strong>Draft Created</strong>
                                        <span>By Alex Rivera • 2h ago</span>
                                    </div>
                                </li>
                                <li>
                                    <span className="dot"></span>
                                    <div className="timeline-content">
                                        <strong>Unit Assigned</strong>
                                        <span>System Event • 5h ago</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LeaseDataEntry;
