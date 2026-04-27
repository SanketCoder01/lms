import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./AddOwner.css";
import { ownerAPI } from "../../services/api";

const EditOwner = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternative_contact: "",
    representative_name: "",
    representative_phone: "",
    representative_email: "",
    address: "",
  });

  /* ================= FETCH OWNER ================= */
  useEffect(() => {
    const fetchOwner = async () => {
      try {
        const res = await ownerAPI.getOwnerById(id);
        const data = res.data;
        const owner = data.owner;

        setFormData({
          name: owner.name || "",
          email: owner.email || "",
          phone: owner.phone || "",
          alternative_contact: owner.alternative_contact || "",
          representative_name: owner.representative_name || "",
          representative_phone: owner.representative_phone || "",
          representative_email: owner.representative_email || "",
          address: owner.address || "",
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Failed to load owner");
        navigate("/admin/owner");
      }
    };

    fetchOwner();
  }, [id, navigate]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => navigate(-1);

  const [submitMessage, setSubmitMessage] = useState('');

  const handleUpdate = async () => {
    setSubmitMessage('');
    try {
      await ownerAPI.updateOwner(id, formData);
      setSubmitMessage('Owner updated successfully');
      setTimeout(() => navigate("/admin/owner"), 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to update owner");
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div className="add-owner-container">
      <Sidebar />

      <main className="add-owner-content">
        <div className="breadcrumb">
          <Link to="/admin/dashboard">HOME</Link> &gt;
          <Link to="/admin/owner"> OWNER</Link> &gt; EDIT
        </div>

        <header className="add-owner-header">
          <h2>Edit Property Owner</h2>
          <p>Update property owner details and contact information.</p>
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
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                className="form-input"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone *</label>
              <input
                className="form-input"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Alternative Contact</label>
              <input
                className="form-input"
                name="alternative_contact"
                value={formData.alternative_contact}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* REPRESENTATIVE */}
        <div className="form-section">
          <div className="section-header">
            <h3>Representative Details</h3>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Representative Name</label>
              <input
                className="form-input"
                name="representative_name"
                value={formData.representative_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Representative Phone</label>
              <input
                className="form-input"
                name="representative_phone"
                value={formData.representative_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Representative Email</label>
            <input
              className="form-input"
              name="representative_email"
              value={formData.representative_email}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* ADDRESS */}
        <div className="form-section">
          <div className="section-header">
            <h3>Address</h3>
          </div>

          <input
            className="form-input"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        {/* ACTIONS */}
        {submitMessage && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
            {submitMessage}
          </div>
        )}
        <div className="form-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button className="btn-submit" onClick={handleUpdate}>
            Update Owner
          </button>
        </div>
      </main>
    </div>
  );
};

export default EditOwner;
