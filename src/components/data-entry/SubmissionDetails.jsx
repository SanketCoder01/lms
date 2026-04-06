import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjectById } from '../../services/api';
import './DataEntryDashboard.css';

const SubmissionDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await getProjectById(id);
                setProject(res.data);
            } catch (err) {
                console.error("Error fetching submission details", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetails();
    }, [id]);

    if (loading) return <div className="dashboard-container"><div className="main-content">Loading...</div></div>;
    if (!project) return <div className="dashboard-container"><div className="main-content">Submission not found.</div></div>;

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>← Back to Dashboard</span>
                            <span style={{ height: '16px', borderLeft: '1px solid #cbd5e1' }}></span>
                            <span style={{ color: '#1e293b', fontWeight: '600' }}>Submission Details #SUB-{project.id}</span>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-secondary" style={{ background: '#eff6ff', color: '#2563eb', border: 'none' }}>Print Summary</button>
                        <button className="icon-btn notification-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                        </button>
                    </div>
                </header>

                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '16px 24px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        <div>
                            <div style={{ color: '#9a3412', fontWeight: '600', fontSize: '0.95rem' }}>Current Status: {project.status || 'Pending'}</div>
                            <div style={{ color: '#ea580c', fontSize: '0.8rem' }}>Submitted on {new Date(project.created_at).toLocaleString()}</div>
                        </div>
                    </div>
                    <div style={{ color: '#c2410c', fontWeight: '600', fontSize: '0.85rem' }}>Assigned to: Compliance Team</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* Project & Unit Details */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                                Project & Unit Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                <div><label className="detail-label">Project Name</label><div className="detail-value">{project.project_name}</div></div>
                                <div><label className="detail-label">Location</label><div className="detail-value" style={{ color: '#2563eb' }}>{project.location}</div></div>
                                <div><label className="detail-label">Total Area</label><div className="detail-value">{project.total_units ? `${project.total_units} Units` : 'N/A'}</div></div>
                                <div><label className="detail-label">Type</label><div className="detail-value">{project.project_type || 'Residential'}</div></div>
                                <div><label className="detail-label">Current Status</label><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>{project.status?.toUpperCase()}</span></div>
                            </div>
                        </div>

                        {/* Lease Agreement */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                                Lease Description
                            </h3>
                            <div style={{ marginBottom: '24px' }}>
                                <p style={{ color: '#64748b', lineHeight: '1.6' }}>{project.description || 'No description provided.'}</p>
                            </div>
                        </div>

                        {/* Unit Images (Placeholder/Actual) */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                Images
                            </h3>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                {project.image_url ? (
                                    <img src={`https://lms-iac2-git-master-sanketg367-gmailcoms-projects.vercel.app${project.image_url}`} alt="Project" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                                ) : (
                                    <div style={{ width: '100px', height: '100px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Owner Details - Mocked because project might not have direct owner info yet */}
                        <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                System Details
                            </h3>

                            <div style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
                                <div style={{ color: '#64748b' }}>Created At</div>
                                <div style={{ fontWeight: '500' }}>{new Date(project.created_at).toLocaleDateString()}</div>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600', color: '#2563eb' }}>
                                    ID: {project.id}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SubmissionDetails;
