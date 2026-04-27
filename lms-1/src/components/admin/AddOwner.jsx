import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ownerAPI, unitAPI } from '../../services/api';
import './AddOwner.css';

const AddOwner = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState([]); // Vacant units

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    representative_name: '', // Added here as per image
    alternative_contact: '', // Optional
    address: '',
    unit_ids: [] // Array of selected unit IDs
  });

  const [selectedUnits, setSelectedUnits] = useState([]); // To track full unit objects for area calc

  // Fetch vacant units on mount
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await unitAPI.getUnits({ status: 'vacant' });
        setUnits(res.data.data || res.data || []);
      } catch (error) {
        console.error("Failed to fetch vacant units", error);
      }
    };
    fetchUnits();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUnitSelect = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    const selectedObjs = [];

    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
        const unit = units.find(u => String(u.id) === String(options[i].value)); // strict comparison
        if (unit) selectedObjs.push(unit);
      }
    }
    setFormData({ ...formData, unit_ids: selectedValues });
    setSelectedUnits(selectedObjs);
  };

  const totalArea = selectedUnits.reduce((acc, curr) => acc + (parseFloat(curr.chargeable_area) || 0), 0);

  const handleCancel = () => navigate('/admin/owner');

  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitMessage('');
    try {
      await ownerAPI.createOwner(formData);
      setSubmitMessage('Owner created successfully');
      setTimeout(() => navigate("/admin/owner"), 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to add owner: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="add-owner-container">
      <Sidebar />
      <main className="add-owner-content">
        <div className="breadcrumb">
          <Link to="/admin/dashboard">HOME</Link> &gt;
          <Link to="/admin/owners"> OWNER</Link> &gt; ADD NEW
        </div>

        <header className="add-owner-header">
          <h2>Add New Property Owner</h2>
          <p>Register a new property owner by filling out the details below. Ensure all KYC documents are verified before submission.</p>
        </header>

        {/* PERSONAL INFO */}
        <div className="form-section">
          <div className="section-header">
            <h3>Personal Information</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                className="form-input"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                className="form-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>representatives name *</label>
              <input
                className="form-input"
                name="representative_name"
                value={formData.representative_name}
                onChange={handleChange}
                placeholder="Name of authorized Rep"
              />
              <span className="helper-text">Authorized Person to contact if owner is unavailable.</span>
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                className="form-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Alternative Contact</label>
              <input
                className="form-input"
                name="alternative_contact"
                value={formData.alternative_contact}
                onChange={handleChange}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        {/* PROPERTY UNITS */}
        <div className="form-section">
          <div className="section-header">
            <h3>Property Units</h3>
            {totalArea > 0 && <span className="total-area-badge">Total Owned Area : {totalArea} sqft</span>}
          </div>

          <div className="form-group">
            <label>Select Units *</label>
            <div className="unit-selection-box">
              {/* Simple Multi-Select for now */}
              <select
                multiple
                value={formData.unit_ids}
                onChange={handleUnitSelect}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', height: '100px' }}
              >
                {units.length === 0 && <option disabled>No vacant units available</option>}
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number} - {u.project_name || 'Project'} ({u.chargeable_area} sqft)
                  </option>
                ))}
              </select>
            </div>
            <span className="helper-text">Select All units owned by this individual. Hold Ctrl/Cmd to select multiple.</span>
          </div>
        </div>

        {/* ADDRESS */}
        <div className="form-section">
          <div className="section-header">
            <h3>Correspondence Address</h3>
          </div>

          <div className="form-group">
            <label>Street Address</label>
            <input
              className="form-input"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St, Apt 4B"
            />
          </div>
        </div>

        {/* ACTIONS */}
        {submitMessage && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
            {submitMessage}
          </div>
        )}
        <div className="form-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Log Out
          </button>
          {/* Note: Image has Log Out on bottom left, but typically Cancel is near Submit. Will use Cancel logic. */}

          {/* Real Submit Actions */}
          <button className="btn-cancel" onClick={handleCancel} style={{ marginRight: 'auto' }}>
            Cancel
          </button>
          <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Owner'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AddOwner;
