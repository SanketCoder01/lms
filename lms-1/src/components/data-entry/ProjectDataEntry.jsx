import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjectById, updateProject, addProject } from '../../services/api';
import './DataEntryDashboard.css';

const ProjectDataEntry = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [formData, setFormData] = useState({
        projectName: '',
        description: '',
        totalFloors: '',
        amenities: {
            rooftopPool: false,
            undergroundParking: false,
            smartEntry: false,
            fitnessCenter: false,
            petSpa: false,
            electricCharging: false,
            concierge: false,
            coworking: false,
            zenGarden: false,
        }
    });

    useEffect(() => {
        if (id) {
            fetchProjectData(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchProjectData = async (projectId) => {
        try {
            setLoading(true);
            const response = await getProjectById(projectId);
            const data = response.data.data;
            if (data) {
                let desc = data.description || '';
                let restoredAmenities = { ...formData.amenities };

                // Parse amenities from description if present
                // We assume the format "\n\nAmenities: A, B, C"
                if (desc.includes('\n\nAmenities: ')) {
                    const parts = desc.split('\n\nAmenities: ');
                    desc = parts[0]; // Keep only the narrative part

                    const amenitiesStr = parts[1];
                    if (amenitiesStr) {
                        const activeAmenities = amenitiesStr.split(', ');

                        // Reset all first to be safe
                        Object.keys(restoredAmenities).forEach(key => restoredAmenities[key] = false);

                        // Reverse match labels to keys
                        activeAmenities.forEach(label => {
                            const matchKey = Object.keys(restoredAmenities).find(k => {
                                const expectedLabel = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                                return expectedLabel === label.trim();
                            });
                            if (matchKey) restoredAmenities[matchKey] = true;
                        });
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    projectName: data.project_name || '',
                    description: desc,
                    totalFloors: data.total_floors || '',
                    amenities: restoredAmenities
                }));
            }
        } catch (error) {
            console.error("Error fetching project", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmenityChange = (name) => {
        setFormData(prev => ({
            ...prev,
            amenities: { ...prev.amenities, [name]: !prev.amenities[name] }
        }));
    };

    const handleSubmit = async () => {
        try {
            setMessage({ text: '', type: '' });
            setLoading(true);

            // Construct Amenities String
            const amenitiesList = Object.keys(formData.amenities)
                .filter(k => formData.amenities[k])
                .map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())) // Labelify
                .join(', ');

            // Payload
            const payload = {
                project_name: formData.projectName,
                description: formData.description || '', // Start with base description
                total_floors: formData.totalFloors,
                status: 'pending_approval'
            };

            // Append amenities cleanly
            if (amenitiesList) {
                payload.description += `\n\nAmenities: ${amenitiesList}`;
            }

            if (id) {
                await updateProject(id, payload);
                setMessage({ text: 'Project submitted for approval successfully!', type: 'success' });
                setTimeout(() => navigate('/data-entry/dashboard'), 2000);
            } else {
                if (!formData.projectName) {
                    setMessage({ text: 'Please enter a Project Name to create a new project.', type: 'error' });
                    setLoading(false);
                    return;
                }
                await addProject(payload);
                setMessage({ text: 'New Project created successfully!', type: 'success' });
                setTimeout(() => navigate('/data-entry/dashboard'), 2000);
            }
        } catch (error) {
            console.error("Error submitting project", error);
            setMessage({ text: "Failed to submit project: " + (error.response?.data?.message || error.message), type: 'error' });
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
                            Home / Projects / <span style={{ color: '#1e293b', fontWeight: '500' }}>Data Entry</span>
                        </div>
                        <h1>Project Data Management</h1>
                        <p style={{ color: '#64748b' }}>Update and manage project-specific administrative details with precision.</p>
                    </div>
                </header>

                <div style={{ background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>

                    {message.text && (
                        <div style={{
                            marginBottom: '24px',
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

                    {/* Project Selection / Creation */}
                    <div style={{ marginBottom: '32px', paddingLeft: '16px', borderLeft: '3px solid #2563eb' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', fontWeight: '600' }}>Mandatory Project Selection</h3>
                        {id ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                                <span>Editing Project ID: <span style={{ fontWeight: '600', color: '#1e293b' }}>{id}</span></span>
                                <button onClick={() => navigate('/data-entry/add-project-data')} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>Clear Selection (Create New)</button>
                            </div>
                        ) : (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter Project Name to Create New..."
                                    value={formData.projectName || ''}
                                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                    style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '8px' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Leave blank to search existing (Search not implemented here yet, use Dashboard)</p>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '40px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                                    Project Description
                                </h3>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>narrative context</span>
                            </div>
                            <textarea
                                rows="8"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter detailed project narrative, architectural inspiration, and market positioning..."
                                style={{ width: '100%', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical' }}
                            ></textarea>

                            <div style={{ marginTop: '40px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                                        Amenities Checklist
                                    </h3>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multiple Selection</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    {Object.keys(formData.amenities).map(key => (
                                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.amenities[key]}
                                                onChange={() => handleAmenityChange(key)}
                                                style={{ width: '18px', height: '18px', accentColor: '#2563eb' }}
                                            />
                                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"></path></svg>
                                Physical Specs
                            </h3>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px', color: '#475569' }}>Total Floors</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={formData.totalFloors}
                                        onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                                        style={{ width: '100%', padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}>FL</span>
                                </div>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Enter the vertical count including penthouses.</p>
                            </div>

                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', marginBottom: '16px', marginTop: '32px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                Media Assets
                            </h3>
                            <div style={{
                                border: '2px dashed #e2e8f0',
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                background: '#f8fafc',
                                cursor: 'pointer'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>Drag files or click to upload</h4>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG up to 10MB each</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                {/* Mock Thumbnails */}
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', backgroundImage: `url('https://images.unsplash.com/photo-1600596542815-2a4d9f6facb8?auto=format&fit=crop&w=100&q=80')`, backgroundSize: 'cover' }}></div>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: '#e2e8f0', backgroundImage: `url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=100&q=80')`, backgroundSize: 'cover' }}></div>
                            </div>

                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Last autosaved at {new Date().toLocaleTimeString()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" style={{ background: 'white' }}>Save Draft</button>
                        <button className="btn-action" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit for Approval ➤'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProjectDataEntry;
