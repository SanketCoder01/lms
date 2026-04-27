import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { ownershipAPI } from '../../../services/api';
import '../Master.css'; // Reusing Master styles

const OwnershipDocumentMaster = () => {
    const [docTypes, setDocTypes] = useState([]);
    const [newType, setNewType] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const res = await ownershipAPI.getDocumentTypes();
            setDocTypes(res.data || []);
        } catch (error) {
            console.error("Failed to fetch types", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newType.trim()) return;

        try {
            await ownershipAPI.addDocumentType({ name: newType.trim() });
            setNewType('');
            fetchTypes();
        } catch (error) {
            alert("Failed to add type: " + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/masters">MASTERS</Link> &gt; OWNERSHIP DOCUMENTS
                    </div>
                    <h1>Ownership Document Types</h1>
                    <p>Manage the list of documents required for ownership chain.</p>
                </header>

                <div className="content-card">
                    <form onSubmit={handleAdd} className="add-master-form" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter Document Type (e.g. Sale Deed)"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        />
                        <button type="submit" className="primary-btn">Add Type</button>
                    </form>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Sequence ID</th>
                                <th>Document Type Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docTypes.map(type => (
                                <tr key={type.id}>
                                    <td>{type.id}</td>
                                    <td>{type.name}</td>
                                    <td><span className="status-badge active">Active</span></td>
                                </tr>
                            ))}
                            {docTypes.length === 0 && !loading && (
                                <tr><td colSpan="3" style={{ textAlign: 'center' }}>No types found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default OwnershipDocumentMaster;
