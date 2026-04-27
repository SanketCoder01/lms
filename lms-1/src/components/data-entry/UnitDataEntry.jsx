import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, unitAPI } from '../../services/api';
import DataEntrySidebar from './DataEntrySidebar';
import './DataEntryDashboard.css';

const UnitDataEntry = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [formData, setFormData] = useState({
        unit_number: '',
        floor_number: '',
        chargeable_area: '',
        status: 'vacant',
        unit_type: '2 Bedrooms' // Just for UI selection, might map to description or logic
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            if (res.data && res.data.data) {
                setProjects(res.data.data);
            }
        } catch (error) {
            console.error("Failed to load projects", error);
        }
    };

    const handleSubmit = async () => {
        setMessage({ text: '', type: '' });
        if (!selectedProject) {
            setMessage({ text: 'Please select a project first.', type: 'error' });
            return;
        }
        if (!formData.unit_number) {
            setMessage({ text: 'Please enter a Unit Number (e.g., 101).', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            // Payload matching schema
            const payload = {
                project_id: selectedProject,
                unit_number: formData.unit_number,
                floor_number: formData.floor_number,
                chargeable_area: formData.chargeable_area,
                status: formData.status,
                // unit_condition: ...
            };

            await unitAPI.createUnit(payload);
            setMessage({ text: 'Unit created successfully!', type: 'success' });
            setTimeout(() => navigate('/data-entry/dashboard'), 2000);
        } catch (error) {
            console.error("Failed to create unit", error);
            setMessage({ text: "Error creating unit: " + (error.response?.data?.message || error.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>
                            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/data-entry')} >← Back to Dashboard</span>
                        </div>
                        <h1>Unit Data Entry</h1>
                        <p style={{ color: '#64748b' }}>Register or update operational unit specifications and status.</p>
                    </div>
                </header>



                {message.text && (
                    <div style={{
                        maxWidth: '1200px',
                        margin: '0 auto 24px auto',
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

                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                    <div style={{ borderLeft: '4px solid #2563eb', paddingLeft: '16px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>1. Property Context</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="input-label">Select Project</label>
                            <select
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">Select a project...</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Unit Number</label>
                            <input
                                type="text"
                                placeholder="e.g. A-101"
                                value={formData.unit_number}
                                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ borderLeft: '4px solid #0891b2', paddingLeft: '16px', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>2. Unit Specifications</h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label className="input-label">Unit Area</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.chargeable_area}
                                    onChange={(e) => setFormData({ ...formData, chargeable_area: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                />
                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 'bold' }}>SQ FT</span>
                            </div>
                        </div>
                        <div>
                            <label className="input-label">Unit Type</label>
                            <select
                                className="form-input"
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                                value={formData.unit_type}
                                onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                            >
                                <option>2 Bedrooms</option>
                                <option>3 Bedrooms</option>
                                <option>Penthouse</option>
                                <option>Studio</option>
                                <option>Commercial Office</option>
                            </select>
                        </div>
                        <div>
                            <label className="input-label">Floor Number</label>
                            <input
                                type="text"
                                placeholder="e.g. 5"
                                value={formData.floor_number}
                                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                            />
                        </div>
                        <div>
                            <label className="input-label">Unit Status</label>
                            <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '6px', overflow: 'hidden' }}>
                                <button
                                    onClick={() => setFormData({ ...formData, status: 'vacant' })}
                                    style={{ flex: 1, padding: '10px', background: formData.status === 'vacant' ? '#f0fdf4' : 'white', border: 'none', fontWeight: '600', color: formData.status === 'vacant' ? '#166534' : '#64748b', borderRight: '1px solid #e2e8f0', cursor: 'pointer' }}
                                >
                                    Vacant
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, status: 'occupied' })}
                                    style={{ flex: 1, padding: '10px', background: formData.status === 'occupied' ? '#eff6ff' : 'white', border: 'none', fontWeight: '600', color: formData.status === 'occupied' ? '#1e40af' : '#64748b', cursor: 'pointer' }}
                                >
                                    Occupied
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" style={{ background: 'white', borderColor: '#e2e8f0' }} onClick={() => setFormData({ unit_number: '', floor_number: '', chargeable_area: '', status: 'vacant', unit_type: '2 Bedrooms' })}>Reset Form</button>
                    <button className="btn-action" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit for Approval ➤'}
                    </button>
                </div>

            </main>
        </div >
    );
};

export default UnitDataEntry;
