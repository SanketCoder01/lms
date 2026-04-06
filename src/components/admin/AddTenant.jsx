import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { tenantAPI, getProjects, unitAPI } from '../../services/api';
import { indianCities, indianStates } from '../../utils/indianLocations';
import { indianIndustries } from '../../utils/indianIndustries';
import { isValidPhone, isValidPAN, isValidAadhaar, isValidCIN } from '../../utils/validators';
// Reusing OwnerList.css or similar generic styles for forms if available
// Assuming we can use standard form styles or inline them for specific layout
import './OwnerList.css';

const AddTenant = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        company_name: '',
        brand_name: '',
        legal_entity_type: '',
        company_registration_number: '',
        industry: '',
        tax_id: '',
        id_type: '',
        website: '',
        contact_person_name: '',
        contact_person_email: '',
        contact_person_phone: '',
        street_address: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'India',
        kyc_status: 'pending',
        status: 'active',
        unit_ids: []
    });

    // Dropdown Data
    const [projects, setProjects] = useState([]);
    const [availableUnits, setAvailableUnits] = useState([]);

    // Selection State
    const [selectedProject, setSelectedProject] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchUnits(selectedProject);
        } else {
            setAvailableUnits([]);
        }
    }, [selectedProject]);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(res.data.data || res.data || []);
        } catch (err) {
            console.error("Failed to fetch projects");
        }
    };

    const fetchUnits = async (projectId) => {
        try {
            // Fetch only vacant units, or all if preferred
            const res = await unitAPI.getUnitsByProject(projectId);
            // Controller returns { data: [units] }
            const units = res.data?.data || [];
            // Filter strictly vacant units
            setAvailableUnits(units.filter(u => u.status === 'vacant'));
        } catch (err) {
            console.error("Failed to fetch units");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Toggle unit selection
    const handleUnitSelect = (unitId) => {
        setFormData(prev => {
            const current = prev.unit_ids;
            if (current.includes(unitId)) {
                return { ...prev, unit_ids: current.filter(id => id !== unitId) };
            } else {
                return { ...prev, unit_ids: [...current, unitId] };
            }
        });
    };

    const [submitMessage, setSubmitMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
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

        setLoading(true);
        setSubmitMessage('');
        try {
            await tenantAPI.createTenant(formData);
            setSubmitMessage('Tenant created successfully');
            setTimeout(() => navigate('/admin/tenants'), 2000);
        } catch (err) {
            console.error(err);
            alert('Failed to create tenant: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        fontSize: '0.9rem',
        marginTop: '6px',
        outline: 'none',
        background: '#f8fafc'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.85rem',
        color: '#475569',
        fontWeight: '500'
    };

    const sectionTitleStyle = {
        fontSize: '1.1rem',
        fontWeight: '600',
        marginBottom: '20px',
        color: '#1e293b',
        borderBottom: '1px solid #e2e8f0',
        paddingBottom: '10px'
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/tenants">TENANT</Link> &gt; <span className="active">ADD NEW</span>
                        </div>
                        <h1>Add New Tenant</h1>
                        <p>Register a new corporate tenant, assign units, and set contact details.</p>
                    </div>
                </header>

                <div className="content-card" style={{ padding: '30px' }}>
                    <form onSubmit={handleSubmit}>

                        {/* 1. Corporate Information */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={sectionTitleStyle}>Corporate Information</h3>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Company Name *</label>
                                    <input type="text" name="company_name" placeholder="e.g. Acme Corp" style={inputStyle} value={formData.company_name} onChange={handleChange} required />
                                </div>
                                <div>
                                    <label style={labelStyle}>Brand Name/Nickname</label>
                                    <input type="text" name="brand_name" placeholder="e.g. Acme" style={inputStyle} value={formData.brand_name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Legal Entity Type</label>
                                    <select name="legal_entity_type" style={inputStyle} value={formData.legal_entity_type} onChange={handleChange}>
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
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Company Registration No.</label>
                                    <input type="text" name="company_registration_number" placeholder="e.g. U12345MH..." style={inputStyle} value={formData.company_registration_number} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Industry</label>
                                    <input
                                        type="text"
                                        name="industry"
                                        list="industry-options"
                                        placeholder="Search Industry"
                                        style={inputStyle}
                                        value={formData.industry}
                                        onChange={handleChange}
                                    />
                                    <datalist id="industry-options">
                                        {indianIndustries.map((ind, index) => (
                                            <option key={index} value={ind} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label style={labelStyle}>Website (optional)</label>
                                    <input type="text" name="website" placeholder="e.g. https://www.company.com" style={inputStyle} value={formData.website} onChange={handleChange} />
                                </div>
                            </div>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>ID Type (Validation Required)</label>
                                    <select name="id_type" style={inputStyle} value={formData.id_type} onChange={handleChange}>
                                        <option value="">Select ID Type</option>
                                        <option value="PAN">PAN</option>
                                        <option value="Aadhaar">Aadhaar</option>
                                        <option value="CIN">CIN</option>
                                        <option value="GSTIN">GSTIN</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>ID Number (matches ID Type)</label>
                                    <input
                                        type="text"
                                        name="tax_id"
                                        placeholder="Enter ID Number"
                                        style={inputStyle}
                                        value={formData.tax_id}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Contact Person Name</label>
                                    <input type="text" name="contact_person_name" placeholder="e.g. John Doe" style={inputStyle} value={formData.contact_person_name} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Contact Person Email</label>
                                    <input type="email" name="contact_person_email" placeholder="e.g. john@example.com" style={inputStyle} value={formData.contact_person_email} onChange={handleChange} />
                                </div>
                            </div>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Contact Person Phone</label>
                                    <input type="text" name="contact_person_phone" placeholder="e.g. +1 234 567 890" style={inputStyle} value={formData.contact_person_phone} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Website (optional)</label>
                                    <input type="text" name="website" placeholder="e.g. https://www.company.com" style={inputStyle} value={formData.website} onChange={handleChange} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Registered Address */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={sectionTitleStyle}>Registered Address</h3>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={labelStyle}>Street Address</label>
                                <input type="text" name="street_address" placeholder="e.g. 123 Main St" style={inputStyle} value={formData.street_address} onChange={handleChange} />
                            </div>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        list="city-options"
                                        placeholder="Search City"
                                        style={inputStyle}
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                    <datalist id="city-options">
                                        {indianCities.map((city, index) => (
                                            <option key={index} value={city} />
                                        ))}
                                    </datalist>
                                </div>
                                <div>
                                    <label style={labelStyle}>State</label>
                                    <select
                                        name="state"
                                        style={inputStyle}
                                        value={formData.state}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select State</option>
                                        {indianStates.map((state, index) => (
                                            <option key={index} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={gridStyle}>
                                <div>
                                    <label style={labelStyle}>Zip/ Postal code</label>
                                    <input type="text" name="zip_code" placeholder="e.g. 10001" style={inputStyle} value={formData.zip_code} onChange={handleChange} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Country</label>
                                    <select name="country" style={inputStyle} value={formData.country} onChange={handleChange}>
                                        <option value="India">India</option>
                                        <option value="USA">USA</option>
                                        <option value="UAE">UAE</option>
                                        <option value="UK">UK</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 3. Unit Selection */}
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={sectionTitleStyle}>Unit Selection</h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>Select the unit(s) to assign to this corporate tenant. At least one unit is required.</p>

                            <div style={{ marginBottom: '20px', maxWidth: '400px' }}>
                                <label style={labelStyle}>Project</label>
                                <select
                                    style={inputStyle}
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedProject && (
                                <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {availableUnits.length === 0 ? (
                                        <p style={{ color: '#666', fontSize: '0.9rem', textAlign: 'center' }}>No available units in this project.</p>
                                    ) : (
                                        availableUnits.map(unit => (
                                            <div
                                                key={unit.id}
                                                onClick={() => handleUnitSelect(unit.id)}
                                                style={{
                                                    background: 'white',
                                                    padding: '15px',
                                                    borderRadius: '8px',
                                                    border: formData.unit_ids.includes(unit.id) ? '1px solid #166534' : '1px solid #e2e8f0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    backgroundColor: formData.unit_ids.includes(unit.id) ? '#f0fdf4' : 'white'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {formData.unit_ids.includes(unit.id) ? (
                                                            <div style={{ width: '20px', height: '20px', background: '#166534', borderRadius: '50%' }}></div>
                                                        ) : (
                                                            <div style={{ width: '20px', height: '20px', border: '2px solid #cbd5e1', borderRadius: '50%' }}></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>Unit {unit.unit_number}</div>
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                            {unit.chargeable_area} sqft • Floor {unit.floor_number}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    background: '#dcfce7',
                                                    color: '#166534',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '500'
                                                }}>
                                                    Available
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {submitMessage && (
                            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
                                {submitMessage}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/tenants')}
                                style={{
                                    padding: '10px 24px',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '10px 24px',
                                    background: '#1d4ed8',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                {loading ? 'Creating...' : 'Create Tenant'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddTenant;
