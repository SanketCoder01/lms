import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import './Settings.css';
import { settingsAPI, FILE_BASE_URL } from '../../services/api';
import axios from 'axios';

const Settings = () => {

    // Display state (Profile Card)
    const [user, setUser] = useState(null);
    // Form state (Inputs)
    const [formData, setFormData] = useState({});

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // password states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    // Dynamic User ID
    const [userId, setUserId] = useState(1); // Default to 1, will update from fetch

    /* ============================
       LOAD USER FROM DB / STORAGE
    ============================ */
    useEffect(() => {
        try {
            // Check if this is a company user (new auth flow)
            // Use sessionStorage for per-tab session isolation
            const companyUserRaw = sessionStorage.getItem('company_user');
            const regularUserRaw = sessionStorage.getItem('user');

            let parsed = null;
            if (companyUserRaw) {
                // Company user — has company_name, phone, address, email, role
                const cu = JSON.parse(companyUserRaw);
                parsed = {
                    id: cu.id || 1,
                    first_name: cu.company_name || cu.first_name || '',
                    last_name: cu.last_name || '',
                    email: cu.email || '',
                    role: cu.role || 'Admin',
                    company_name: cu.company_name || '',
                    phone: cu.phone || '',
                    address: cu.address || '',
                    profile_image: cu.profile_image || null,
                };
            } else if (regularUserRaw) {
                const u = JSON.parse(regularUserRaw);
                parsed = {
                    id: u.id || 1,
                    first_name: u.first_name || '',
                    last_name: u.last_name || '',
                    email: u.email || '',
                    role: u.role || 'Admin',
                    company_name: u.company_name || '',
                    phone: u.phone || '',
                    address: u.address || '',
                    profile_image: u.profile_image || null,
                };
            }

            if (parsed) {
                setUser(parsed);
                setFormData({
                    first_name: parsed.first_name || '',
                    last_name: parsed.last_name || '',
                    email: parsed.email || '',
                    company_name: parsed.company_name || '',
                    phone: parsed.phone || '',
                    address: parsed.address || '',
                });
                if (parsed.id) setUserId(parsed.id);
            } else {
                setUser({
                    id: 1, first_name: "Admin", last_name: "User",
                    email: "admin@example.com", role: "Admin",
                    company_name: '', phone: '', address: '', profile_image: null
                });
            }
        } catch (e) {
            console.error("Error reading user from localStorage:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ============================
       HANDLE INPUT CHANGE
    ============================ */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /* ============================
       SAVE PROFILE
    ============================ */
    const handleSave = () => {
        settingsAPI.updateSettings(formData)
            .then(() => {
                setMessage({ text: 'Profile updated successfully', type: 'success' });
                // Update display state only on success
                setUser(formData);
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            })
            .catch(() => setMessage({ text: 'Update failed', type: 'error' }));
    };

    /* ============================
       PHOTO UPLOAD
    ============================ */
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setMessage({ text: 'Only image files allowed', type: 'error' });
            return;
        }

        const data = new FormData();
        data.append("photo", file);

        settingsAPI.uploadPhoto(userId, data)
            .then(res => {
                const newImage = res.data.image;
                setUser(prev => ({ ...prev, profile_image: newImage }));
                setFormData(prev => ({ ...prev, profile_image: newImage }));
                setMessage({ text: 'Photo updated successfully', type: 'success' });
            })
            .catch(() => setMessage({ text: 'Photo upload failed', type: 'error' }));
    };

    /* ============================
       REMOVE PHOTO
    ============================ */
    const handleRemovePhoto = () => {
        settingsAPI.removePhoto(userId)
            .then(() => {
                setUser(prev => ({ ...prev, profile_image: null }));
                setFormData(prev => ({ ...prev, profile_image: null }));
                setMessage({ text: 'Photo removed successfully', type: 'success' });
            })
            .catch(() => setMessage({ text: 'Failed to remove photo', type: 'error' }));
    };

    /* ============================
       UPDATE PASSWORD
    ============================ */
    const handlePasswordUpdate = () => {
        if (!currentPassword || !newPassword) {
            setMessage({ text: 'Fill both password fields', type: 'error' });
            return;
        }

        settingsAPI.updatePassword(userId, {
            currentPassword,
            newPassword
        })
            .then(() => {
                setMessage({ text: 'Password updated successfully', type: 'success' });
                setCurrentPassword("");
                setNewPassword("");
            })
            .catch((err) => {
                if (err.response && err.response.status === 401) {
                    setMessage({ text: 'Incorrect current password', type: 'error' });
                } else {
                    setMessage({ text: 'Password update failed', type: 'error' });
                }
            });
    };

    /* ============================
       WIPE DATA
    ============================ */
    const handleWipeData = () => {
        if (!window.confirm("WARNING: This will permanently delete ALL data (projects, units, leases, masters) and update the database schema. This action CANNOT be undone. Proceed?")) {
            return;
        }
        
        axios.delete(`${FILE_BASE_URL.replace('/uploads', '')}/api/leases/wipe-all-data-danger`)
            .then((res) => {
                setMessage({ text: 'Data wiped successfully!', type: 'success' });
                alert("Data wiped successfully! You can now start fresh.");
            })
            .catch((err) => {
                console.error("Wipe failed:", err);
                setMessage({ text: 'Failed to wipe data: ' + (err.response?.data?.message || err.message), type: 'error' });
            });
    };

    if (loading) return <div style={{ padding: 30 }}>Loading...</div>;
    if (!user) return <div style={{ padding: 30 }}>User not found</div>;

    // Correct image path or offline placeholder
    const profileImage = user.profile_image
        ? `${FILE_BASE_URL}${user.profile_image}`
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23cccccc'%3E%3Cpath d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z' /%3E%3C/svg%3E";

    return (
        <div className="settings-container">
            <Sidebar />

            <main className="settings-content">
                <header className="settings-header">
                    <h2>Profile Settings</h2>
                    <div className="sub-header">
                        Manage your personal details, security preferences, and account settings.
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

                {/* ================= PROFILE CARD (Display Only) ================= */}
                <div className="profile-card">
                    <div className="profile-info-left">
                        <div className="profile-avatar-container">
                            <img
                                src={profileImage}
                                alt="Profile"
                                className="profile-avatar"
                            />

                            <input
                                type="file"
                                accept="image/*"
                                hidden
                                id="photoUpload"
                                onChange={handlePhotoChange}
                            />

                            {/* Pencil icon */}
                            <label
                                htmlFor="photoUpload"
                                className="edit-avatar-icon"
                                style={{ zIndex: 1 }}
                            >
                                ✎
                            </label>
                        </div>

                        <div className="profile-text">
                            <h3>{user.first_name} {user.last_name}</h3>
                            <span className="role">{user.role || "Administrator"}</span>
                            <span className="location">{user.location || "—"}</span>
                        </div>
                    </div>

                    <div className="profile-actions" style={{ zIndex: 5 }}>
                        <button
                            type="button"
                            className="btn-remove"
                            onClick={handleRemovePhoto}
                        >
                            Remove
                        </button>

                        <button
                            type="button"
                            className="btn-change-photo"
                            onClick={() => document.getElementById("photoUpload").click()}
                        >
                            Change Photo
                        </button>
                    </div>
                </div>

                {/* ================= PERSONAL INFO (Form Input) ================= */}
                <section className="settings-section">
                    <h3>Account Information</h3>

                    <div className="form-grid">
                        {/* Email — always show prominently */}
                        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email || ''}
                                readOnly
                                style={{ background: '#f9fafb', cursor: 'default', color: '#374151' }}
                            />
                        </div>

                        {/* Company Name */}
                        {formData.company_name && (
                            <div className="form-field" style={{ gridColumn: '1 / -1' }}>
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    value={formData.company_name || ''}
                                    readOnly
                                    style={{ background: '#f9fafb', cursor: 'default', color: '#374151' }}
                                />
                            </div>
                        )}

                        <div className="form-field">
                            <label>First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone || ""}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-field">
                            <label>Role</label>
                            <input
                                type="text"
                                value={user?.role || 'Admin'}
                                readOnly
                                style={{ background: '#f9fafb', cursor: 'default', color: '#374151' }}
                            />
                        </div>
                    </div>

                    <button className="btn-save" onClick={handleSave}>
                        Save Changes
                    </button>
                </section>

                <hr />

                {/* ================= SECURITY ================= */}
                <section className="settings-section">
                    <h3>Security & Password</h3>

                    <div className="form-field">
                        <label>Email Address</label>
                        <input type="email" value={user.email || ""} readOnly />
                    </div>

                    <div className="form-field">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                        />
                    </div>

                    <div className="form-field">
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>

                    <button className="btn-save" onClick={handlePasswordUpdate}>
                        Update Password
                    </button>
                </section>

                <hr />

                {/* ================= DANGER ZONE ================= */}
                <section className="settings-section" style={{ border: '1px solid #dc2626', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                    <h3 style={{ color: '#dc2626' }}>Danger Zone</h3>
                    <p style={{ color: '#666', marginBottom: '15px' }}>
                        Permanently delete all projects, units, leases, parties, and masters from the system. This will also ensure the database schema is up-to-date.
                    </p>
                    <button 
                        style={{ background: '#dc2626', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} 
                        onClick={handleWipeData}
                    >
                        Wipe All Data
                    </button>
                </section>
            </main>
        </div>
    );
};

export default Settings;
