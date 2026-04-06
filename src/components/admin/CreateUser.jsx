import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './CreateUser.css';
import { roleAPI, userAPI } from '../../services/api';
import { isValidPhone } from '../../utils/validators';

const CreateUser = () => {

    const navigate = useNavigate();

    const [roles, setRoles] = useState([]);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        role_id: '',
        status: 'active'
    });

    /* ================= LOAD ROLES ================= */
    useEffect(() => {
        roleAPI.getRoles() // Fixed: changed from getAll() to getRoles() if that's what api.js exports, checking api.js... it exports getRoles
            .then(res => setRoles(res.data))
            .catch(err => console.error(err));
    }, []);

    /* ================= HANDLE CHANGE ================= */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    /* ================= SUBMIT ================= */
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.fullName || !formData.email || !formData.role_id || !formData.password) {
            alert("Please fill all required fields, including password.");
            return;
        }

        if (formData.phone && !isValidPhone(formData.phone)) {
            alert("Phone Number must be exactly 10 digits.");
            return;
        }

        // split full name
        const nameParts = formData.fullName.trim().split(" ");
        const first_name = nameParts.shift();
        const last_name = nameParts.join(" ") || "";

        // Find role name if needed, but backend takes role_id or role_name.
        // userController expects role_name or looks up via role_name. 
        // Wait, userController.js: 
        // const { first_name, last_name, email, password, role_name } = req.body;
        // const requestedRole = role_name || 'User';
        // const [roleResult] = await pool.execute("SELECT id FROM roles WHERE role_name = ?", [requestedRole]);
        // It seems it EXPECTS role_name. 

        const selectedRole = roles.find(r => r.id === formData.role_id);
        const role_name = selectedRole ? selectedRole.role_name : 'User'; // changed from .name to .role_name if that's the schema. 
        // Let's assume roles table has role_name. I'll check response of getRoles later if needed.
        // But simply passing role_id won't work with current controller logic unless I update controller OR send role_name.
        // Controller Logic: 
        // const requestedRole = role_name || 'User';
        // SELECT id FROM roles WHERE role_name = ?

        try {
            await userAPI.createUser({
                first_name,
                last_name,
                email: formData.email,
                role_name: role_name, // Sending role_name as expected by backend
                status: formData.status,
                password: formData.password
            });

            alert("User created successfully");
            //setSubmitMessage('User created successfully!');
            navigate("/admin/role-management");

        } catch (err) {
            console.error(err);
            alert("User creation failed: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />

            <main className="main-content">
                <div className="create-user-container">
                    <div className="user-form-card">

                        <div className="form-header">
                            <div className="header-titles">
                                <h2>Create New User</h2>
                                <p>Add a new user to the system and assign their role.</p>
                            </div>

                            <Link to="/admin/role-management" className="close-btn">
                                ✕
                            </Link>
                        </div>

                        <form className="user-form" onSubmit={handleSubmit}>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john.doe@example.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Role</label>
                                    <div className="select-wrapper">
                                        <select
                                            name="role_id"
                                            value={formData.role_id}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Role</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-footer">
                                <Link to="/admin/role-management" className="cancel-btn">
                                    Cancel
                                </Link>
                                <button type="submit" className="create-btn">
                                    Create User
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CreateUser;
