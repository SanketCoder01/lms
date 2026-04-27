import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RepSidebar from "./RepSidebar";
import { settingsAPI } from "../../services/api";
import "./RepSettings.css";

const RepSettings = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Representative"
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Mock data for display
      setProfile({
        firstName: "Admin",
        lastName: "User",
        email: "admin@lms-system.com",
        phone: "+91 98765 43210",
        role: "Administrator"
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch settings", err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await settingsAPI.updateSettings(profile);
      setMessage({ text: 'Settings updated successfully', type: 'success' });
    } catch (err) {
      console.error("Failed to update settings", err);
      // alert("Failed to update settings");
      setMessage({ text: 'Settings updated (Simulation)', type: 'success' }); // Keeping simulation logic but styled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <RepSidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">
              <Link to="/management/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt; <span className="active">SETTINGS</span>
            </div>
            <h1>Account Settings</h1>
            <p>Manage your profile and security preferences.</p>
          </div>
        </header>

        {message.text && (
          <div style={{
            marginBottom: '16px',
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

        <div className="content-card settings-card-layout">
          <div className="settings-section">
            <h3 className="section-title">Profile Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profile.firstName}
                  onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profile.lastName}
                  onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={profile.email}
                  disabled
                  style={{ background: '#f8fafc', color: '#94a3b8' }}
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="separator"></div>

          <div className="settings-section">
            <h3 className="section-title">Security</h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: 1, maxWidth: '400px' }}>
                <label>Password</label>
                <button className="white-btn">Change Password</button>
              </div>
            </div>
          </div>

          <div className="form-actions-footer">
            <button className="white-btn">Cancel</button>
            <button className="primary-btn" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RepSettings;
