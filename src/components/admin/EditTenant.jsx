import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import { tenantAPI, getProjects, unitAPI } from '../../services/api';
import { isValidPhone, isValidPAN, isValidAadhaar, isValidCIN } from '../../utils/validators';
import { indianIndustries } from '../../utils/indianIndustries';
import './AddTenant.css';

const EditTenant = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Dropdown Data
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [loadingUnits, setLoadingUnits] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        company_name: '',
        brand_name: '',
        legal_entity_type: '',
        company_registration_number: '',
        industry: '',
        tax_id: '',
        id_type: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        website: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: '',
        unit_ids: []
    });

    const [subTenants, setSubTenants] = useState([]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // 1. Fetch Projects
                const projRes = await getProjects();
                // Ensure we get an array. Matches AddTenant.jsx logic
                const projectList = Array.isArray(projRes.data) ? projRes.data
                    : (projRes.data?.data || projRes.data?.projects || []);
                setProjects(Array.isArray(projectList) ? projectList : []);

                // 2. Fetch Tenant Details
                const tenantRes = await tenantAPI.getTenantById(id);
                const data = tenantRes.data;

                setFormData({
                    company_name: data.company_name || '',
                    brand_name: data.brand_name || '',
                    legal_entity_type: data.legal_entity_type || '',
                    company_registration_number: data.registration_no || data.company_registration_number || '',
                    industry: data.industry || '',
                    tax_id: data.tax_id || '',
                    id_type: data.id_type || '',
                    contact_person_name: data.contact_person_name || '',
                    contact_person_email: data.contact_person_email || '',
                    contact_person_phone: data.contact_person_phone || '',
                    website: data.website || '',
                    street_address: data.address || data.street_address || '',
                    city: data.city || '',
                    state: data.state || '',
                    zip_code: data.zip_code || '',
                    country: data.country || '',
                    kyc_status: data.kyc_status || 'pending',
                    unit_ids: data.units ? data.units.map(u => u.id) : [] // Pre-select units
                });

                // Map existing subtenants
                if (data.subtenants) {
                    setSubTenants(data.subtenants.map(st => ({
                        company_name: st.company_name,
                        registration_number: st.registration_no || st.registration_number || '',
                        allotted_area_sqft: st.allotted_area || st.allotted_area_sqft || '',
                        contact_person_name: st.contact_person || st.contact_person_name || '',
                        contact_person_email: st.email || st.contact_person_email || '',
                        contact_person_phone: st.phone || st.contact_person_phone || ''
                    })));
                }

                // If tenant has units, try to deduce project from first unit (Optional - assuming single project for now)
                if (data.units && data.units.length > 0 && projectList.length > 0) {
                    const firstUnit = data.units[0];
                    if (firstUnit.project_id) setSelectedProjectId(firstUnit.project_id);
                }

            } catch (err) {
                console.error("Error loading tenant data:", err);
                setError("Failed to load tenant details.");
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, [id]);

    // When Project changes, fetch units
    useEffect(() => {
        if (selectedProjectId) {
            fetchUnits(selectedProjectId);
        }
    }, [selectedProjectId]);

    const fetchUnits = async (pid) => {
        try {
            setLoadingUnits(true);
            const res = await unitAPI.getUnitsByProject(pid);
            // Response structure is { data: { data: [...] } } or similar check
            // Based on controller: res.json({ data: rows }) -> axios res.data.data
            const unitsList = res.data?.data || [];
            setUnits(Array.isArray(unitsList) ? unitsList : []);
        } catch (err) {
            console.error("Error fetching units:", err);
            setUnits([]);
        } finally {
            setLoadingUnits(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleUnitToggle = (unitId) => {
        const idInt = parseInt(unitId);
        setFormData(prev => ({
            ...prev,
            unit_ids: prev.unit_ids.includes(idInt)
                ? prev.unit_ids.filter(id => id !== idInt)
                : [...prev.unit_ids, idInt]
        }));
    };

    // Subtenant Handlers
    const addSubTenant = () => {
        setSubTenants([...subTenants, {
            company_name: '',
            registration_number: '',
            contact_person_name: '',
            contact_person_email: '',
            contact_person_phone: '',
            allotted_area_sqft: ''
        }]);
    };

    const removeSubTenant = (index) => {
        const updated = subTenants.filter((_, i) => i !== index);
        setSubTenants(updated);
    };

    const updateSubTenant = (index, field, value) => {
        const updated = [...subTenants];
        updated[index][field] = value;
        setSubTenants(updated);
    };

    const [submitMessage, setSubmitMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!isValidPhone(formData.contact_person_phone)) {
            alert("Contact Person Phone must be exactly 10 digits.");
            return;
        }

        // ID Validation
        if (formData.id_type === 'PAN' && !isValidPAN(formData.tax_id)) {
            alert("Invalid PAN format. Please check.");
            return;
        }
        if (formData.id_type === 'Aadhaar' && !isValidAadhaar(formData.tax_id)) {
            alert("Invalid Aadhaar format. Must be 12 digits.");
            return;
        }
        if (formData.id_type === 'CIN' && !isValidCIN(formData.tax_id)) {
            alert("Invalid CIN format. Please check.");
            return;
        }

        // Subtenant Validation
        for (let i = 0; i < subTenants.length; i++) {
            const st = subTenants[i];
            if (st.contact_person_phone && !isValidPhone(st.contact_person_phone)) {
                alert(`Subtenant #${i + 1} Phone must be exactly 10 digits.`);
                return;
            }
        }

        setSaving(true);
        setError('');
        setSubmitMessage('');

        try {
            const payload = {
                ...formData,
                subtenants: subTenants
            };
            await tenantAPI.updateTenant(id, payload);
            setSubmitMessage('Tenant updated successfully');
            setTimeout(() => navigate('/admin/tenants'), 2000);
        } catch (err) {
            const serverError = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(`Update failed: ${serverError}`);
            console.error("Update error details:", err.response?.data);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="add-tenant-container">
                    <div className="unit-form-card">
                        <div className="form-header">
                            <div className="header-titles">
                                <h2>Edit Tenant</h2>
                                <p>Update tenant details, manage units, and configure subtenants.</p>
                            </div>
                            <button className="close-btn" onClick={() => navigate('/admin/tenant')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div style={{ color: '#e53e3e', padding: '10px', marginBottom: '15px', background: '#fff5f5', borderRadius: '4px' }}>
                                    {error}
                                </div>
                            )}

                            {/* Section 1: Corporate Info */}
                            <div className="form-section">
                                <h3>Corporate Information</h3>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Company Name *</label>
                                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Brand Name/Nickname</label>
                                        <input type="text" name="brand_name" value={formData.brand_name} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Legal Entity Type</label>
                                        <select name="legal_entity_type" value={formData.legal_entity_type} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <option value="">Select Type</option>
                                            <option value="Private Limited">Private Limited</option>
                                            <option value="Public Limited">Public Limited</option>
                                            <option value="LLP">LLP</option>
                                            <option value="Partnership">Partnership</option>
                                            <option value="Proprietorship">Proprietorship</option>
                                            <option value="HUF">HUF</option>
                                            <option value="Individual">Individual</option>
                                            <option value="Trust">Trust</option>
                                            <option value="Society">Society</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Registration No.</label>
                                        <input type="text" name="company_registration_number" value={formData.company_registration_number} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Industry</label>
                                        <input
                                            type="text"
                                            name="industry"
                                            list="industry-options"
                                            value={formData.industry}
                                            onChange={handleChange}
                                            placeholder="Select Industry"
                                        />
                                        <datalist id="industry-options">
                                            {indianIndustries.map((ind, i) => (
                                                <option key={i} value={ind} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div className="form-group">
                                        <label>Website</label>
                                        <input type="text" name="website" value={formData.website} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>ID Type</label>
                                        <select name="id_type" value={formData.id_type} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <option value="">Select ID Type</option>
                                            <option value="PAN">PAN</option>
                                            <option value="Aadhaar">Aadhaar</option>
                                            <option value="CIN">CIN</option>
                                            <option value="GSTIN">GSTIN</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>ID Number</label>
                                        <input type="text" name="tax_id" value={formData.tax_id} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>KYC Status</label>
                                        <select name="kyc_status" value={formData.kyc_status} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                            <option value="pending">Pending</option>
                                            <option value="verified">Verified</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Contact Person */}
                            <div className="form-section">
                                <h3>Contact Person</h3>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Full Name *</label>
                                        <input type="text" name="contact_person_name" value={formData.contact_person_name} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Email *</label>
                                        <input type="email" name="contact_person_email" value={formData.contact_person_email} onChange={handleChange} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone *</label>
                                        <input type="text" name="contact_person_phone" value={formData.contact_person_phone} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Address */}
                            <div className="form-section">
                                <h3>Registered Address</h3>
                                <div className="form-group">
                                    <label>Street Address</label>
                                    <input type="text" name="street_address" value={formData.street_address} onChange={handleChange} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>City</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input type="text" name="state" value={formData.state} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Zip Code</label>
                                        <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>

                            {/* Section 4: Unit Assignment */}
                            <div className="form-section">
                                <h3>Unit Assignment</h3>
                                <p style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Use this section to add more units. Existing units are pre-selected.</p>
                                <div className="form-group">
                                    <label>Select Project (to find new units)</label>
                                    <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)}>
                                        <option value="">Select Project</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                                    </select>
                                </div>

                                {selectedProjectId && (
                                    <div className="form-group">
                                        <label>Select Units</label>
                                        {loadingUnits ? <p>Loading units...</p> : (
                                            <div className="unit-selection-box" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', padding: '10px', borderRadius: '4px' }}>
                                                {units.length === 0 ? <p>No units found for this project.</p> : units.map(u => (
                                                    <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.unit_ids.includes(u.id)}
                                                            onChange={() => handleUnitToggle(u.id)}
                                                        />
                                                        <span>Unit {u.unit_number} ({u.chargeable_area} sqft) - {u.status}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Section 5: Subtenants */}
                            <div className="form-section">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                    <h3>Subtenants</h3>
                                    <button type="button" onClick={addSubTenant} style={{ padding: '6px 12px', background: '#eee', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Subtenant</button>
                                </div>
                                {subTenants.map((st, i) => (
                                    <div key={i} style={{ background: '#f9fafb', padding: '15px', borderRadius: '6px', marginBottom: '10px', border: '1px solid #eee' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <strong>Subtenant #{i + 1}</strong>
                                            <button type="button" onClick={() => removeSubTenant(i)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                        </div>
                                        <div className="form-row three-cols">
                                            <div className="form-group"><label>Company Name</label><input type="text" value={st.company_name} onChange={(e) => updateSubTenant(i, 'company_name', e.target.value)} /></div>
                                            <div className="form-group"><label>Reg No</label><input type="text" value={st.registration_number} onChange={(e) => updateSubTenant(i, 'registration_number', e.target.value)} /></div>
                                            <div className="form-group"><label>Allocated Area</label><input type="number" value={st.allotted_area_sqft} onChange={(e) => updateSubTenant(i, 'allotted_area_sqft', e.target.value)} /></div>
                                        </div>
                                        <div className="form-row three-cols">
                                            <div className="form-group"><label>Contact Name</label><input type="text" value={st.contact_person_name} onChange={(e) => updateSubTenant(i, 'contact_person_name', e.target.value)} /></div>
                                            <div className="form-group"><label>Email</label><input type="text" value={st.contact_person_email} onChange={(e) => updateSubTenant(i, 'contact_person_email', e.target.value)} /></div>
                                            <div className="form-group"><label>Phone</label><input type="text" value={st.contact_person_phone} onChange={(e) => updateSubTenant(i, 'contact_person_phone', e.target.value)} /></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {submitMessage && (
                                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
                                    {submitMessage}
                                </div>
                            )}

                            <div className="form-footer">
                                <button type="button" className="cancel-btn" onClick={() => navigate('/admin/tenant')}>Cancel</button>
                                <button type="submit" className="create-btn" disabled={saving}>{saving ? 'Saving...' : 'Update Tenant'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default EditTenant;
