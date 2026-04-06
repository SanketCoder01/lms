import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { filterAPI, partyAPI } from '../../services/api';
import { supabase } from '../../services/supabase';
import axios from 'axios';
import { isValidPhone, isValidPAN, isValidAadhaar, isValidCIN } from '../../utils/validators';
import './PartyForm.css';

const AddParty = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [brandCategories, setBrandCategories] = useState([]);
    const [partyTypes, setPartyTypes] = useState(['Tenant', 'Owner', 'Lessor', 'Sub-Lessee']); // Fallback if admin has not set them
    const [ownerGroupings, setOwnerGroupings] = useState([]);
    const [statesList, setStatesList] = useState([]);
    const [citiesList, setCitiesList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        type: 'Individual',
        party_type: 'Tenant',
        company_name: '',
        brand_name: '',
        brand_category: '',
        legal_entity_type: '',
        title: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        alt_phone: '',
        identification_type: '',
        identification_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'India',
        representative_designation: '',
        owner_group: ''
    });

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                // Fetch dynamic filters mapping
                const [bcRes, ptRes, ogRes, statesRes] = await Promise.all([
                    filterAPI.getFilterOptions("brand_category").catch(() => ({ data: { data: [] } })),
                    filterAPI.getFilterOptions("Party Type").catch(() => ({ data: { data: [] } })),
                    filterAPI.getFilterOptions("Owner Grouping").catch(() => ({ data: { data: [] } })),
                    axios.get('https://lms-sepia-mu.vercel.app/api/locations/states').catch(() => ({ data: [] }))
                ]);

                if (bcRes.data.data?.length > 0) setBrandCategories(bcRes.data.data);
                if (ptRes.data.data?.length > 0) setPartyTypes(ptRes.data.data.map(d => d.option_value));
                if (ogRes.data.data?.length > 0) setOwnerGroupings(ogRes.data.data);
                if (statesRes.data?.length > 0) setStatesList(statesRes.data);

            } catch (e) {
                console.error(e);
            }
        };
        fetchFilters();

        const channel = supabase.channel('locations-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'states' },
                () => {
                    axios.get('https://lms-sepia-mu.vercel.app/api/locations/states').then(res => setStatesList(res.data)).catch(console.error);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchCities = async (stateName) => {
        try {
            const stateObj = statesList.find(s => s.name === stateName);
            if (!stateObj) {
                setCitiesList([]);
                return;
            }
            const citiesRes = await axios.get(`https://lms-sepia-mu.vercel.app/api/locations/cities/${stateObj.id}`);
            setCitiesList(citiesRes.data || []);
        } catch (e) {
            console.error("Failed to fetch cities", e);
            setCitiesList([]);
        }
    };

    // Sub to cities changing for the selected state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!formData.state) return;
        const channel = supabase.channel('cities-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cities' }, () => {
                fetchCities(formData.state);
            }).subscribe();
        return () => supabase.removeChannel(channel);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.state, statesList]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'state') {
            setFormData({ ...formData, state: value, city: '' });
            fetchCities(value);
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!isValidPhone(formData.phone)) {
            alert("Phone Number must be exactly 10 digits.");
            return;
        }
        if (formData.alt_phone && !isValidPhone(formData.alt_phone)) {
            alert("Alternate Phone Number must be exactly 10 digits.");
            return;
        }

        // ID Validation
        if (formData.identification_type === 'PAN' && !isValidPAN(formData.identification_number)) {
            alert("Invalid PAN format. Please check.");
            return;
        }
        if (formData.identification_type === 'Aadhar' && !isValidAadhaar(formData.identification_number)) {
            alert("Invalid Aadhaar format. Must be 12 digits.");
            return;
        }
        if (formData.identification_type === 'CIN' && !isValidCIN(formData.identification_number)) {
            alert("Invalid CIN format. Please check.");
            return;
        }

        setLoading(true);
        try {
            await partyAPI.createParty(formData);
            navigate('/admin/parties');
        } catch (error) {
            console.error("Failed to create party", error);
            alert("Failed to create party. Please check the inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="party-form-container">
            <Sidebar />
            <main className="party-form-content">
                <div className="breadcrumb">
                    <Link to="/admin/dashboard">HOME</Link> &gt;
                    <Link to="/admin/parties"> PARTIES</Link> &gt; ADD NEW
                </div>

                <header className="party-form-header">
                    <h2>Add New Party</h2>
                    <p>Enter details for a new individual or company.</p>
                </header>

                <form onSubmit={handleSubmit}>
                    {/* TYPE SELECTION */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Party Role & Structure</h3>
                        </div>
                        <div className="form-row">
                            <div className="form-group" style={{ maxWidth: '300px' }}>
                                <label>Party Type *</label>
                                <select
                                    className="form-select"
                                    name="party_type"
                                    value={formData.party_type}
                                    onChange={handleChange}
                                >
                                    {partyTypes.map((pt, i) => (
                                        <option key={i} value={pt}>{pt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ maxWidth: '300px' }}>
                                <label>Profile Structure *</label>
                                <select
                                    className="form-select"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Company">Company</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* COMPANY DETAILS (Conditional) */}
                    {formData.type === 'Company' && (
                        <div className="form-section">
                            <div className="section-header">
                                <h3>Company Details</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Company Name *</label>
                                    <input
                                        className="form-input"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        required={formData.type === 'Company'}
                                        placeholder="e.g. Acme Corp Pvt Ltd"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Brand Name/Nickname</label>
                                    <input
                                        className="form-input"
                                        name="brand_name"
                                        value={formData.brand_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Acme"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Brand/Investor Category</label>
                                    <select
                                        className="form-select"
                                        name="brand_category"
                                        value={formData.brand_category}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Category</option>
                                        {brandCategories.map((c) => (
                                            <option key={c.id} value={c.option_value}>{c.option_value}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Legal Entity Type</label>
                                    <select
                                        className="form-select"
                                        name="legal_entity_type"
                                        value={formData.legal_entity_type}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Private Limited">Private Limited</option>
                                        <option value="Public Limited">Public Limited</option>
                                        <option value="LLP">LLP</option>
                                        <option value="Partnership">Partnership</option>
                                        <option value="Proprietorship">Proprietorship</option>
                                        <option value="HUF">HUF</option>
                                        <option value="Trust">Trust</option>
                                        <option value="Society">Society</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PERSONAL / REPRESENTATIVE INFO */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>{formData.type === 'Company' ? 'Representative Information' : 'Personal Information'}</h3>
                        </div>
                        {formData.type === 'Company' && (
                            <div className="form-row" style={{ marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label>Designation of Company Representative</label>
                                    <input
                                        className="form-input"
                                        name="representative_designation"
                                        value={formData.representative_designation}
                                        onChange={handleChange}
                                        placeholder="e.g. Director, Manager"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 0.2 }}>
                                <label>Title</label>
                                <select
                                    className="form-select"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                >
                                    <option value="">Select</option>
                                    <option value="Mr.">Mr.</option>
                                    <option value="Mrs.">Mrs.</option>
                                    <option value="Ms.">Ms.</option>
                                    <option value="Dr.">Dr.</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    className="form-input"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="First Name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input
                                    className="form-input"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Last Name"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address *</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number *</label>
                                <input
                                    className="form-input"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="+91..."
                                />
                            </div>
                            <div className="form-group">
                                <label>Alt Phone</label>
                                <input
                                    className="form-input"
                                    name="alt_phone"
                                    value={formData.alt_phone}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                    </div>

                    {/* OWNER DETAILS */}
                    {formData.party_type === 'Owner' && (
                        <div className="form-section">
                            <div className="section-header">
                                <h3>Owner Grouping</h3>
                            </div>
                            <div className="form-row">
                                <div className="form-group" style={{ maxWidth: '400px' }}>
                                    <label>Grouping of Owners</label>
                                    <select
                                        className="form-select"
                                        name="owner_group"
                                        value={formData.owner_group}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Grouping (Optional)</option>
                                        {ownerGroupings.map((og) => (
                                            <option key={og.id} value={og.option_value}>{og.option_value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* IDENTIFICATION -> Party Details */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Party Details</h3>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>ID Type</label>
                                <select
                                    className="form-select"
                                    name="identification_type"
                                    value={formData.identification_type}
                                    onChange={handleChange}
                                >
                                    <option value="PAN">PAN</option>
                                    <option value="Aadhar">Aadhaar</option>
                                    <option value="CIN">CIN</option>
                                    <option value="GSTIN">GSTIN</option>
                                    <option value="Voter ID">Voter ID</option>
                                    <option value="Passport">Passport</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>ID Number</label>
                                <input
                                    className="form-input"
                                    name="identification_number"
                                    value={formData.identification_number}
                                    onChange={handleChange}
                                    placeholder="Enter ID Number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* ADDRESS */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Address</h3>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Address Line 1</label>
                                <input
                                    className="form-input"
                                    name="address_line1"
                                    value={formData.address_line1}
                                    onChange={handleChange}
                                    placeholder="Street Address"
                                />
                            </div>
                            <div className="form-group">
                                <label>Address Line 2</label>
                                <input
                                    className="form-input"
                                    name="address_line2"
                                    value={formData.address_line2}
                                    onChange={handleChange}
                                    placeholder="Apartment, Suite, etc."
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>State</label>
                                <select
                                    className="form-select"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                >
                                    <option value="">Select State</option>
                                    {statesList.map((state) => (
                                        <option key={state.id} value={state.name}>{state.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <select
                                    className="form-select"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    disabled={!formData.state}
                                >
                                    <option value="">Select City</option>
                                    {citiesList.map((city) => (
                                        <option key={city.id} value={city.name}>{city.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Postal Code</label>
                                <input
                                    className="form-input"
                                    name="postal_code"
                                    value={formData.postal_code}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Country</label>
                                <input
                                    className="form-input"
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/parties')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Party'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default AddParty;
