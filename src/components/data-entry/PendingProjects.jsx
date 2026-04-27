import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects } from '../../services/api';
import './DataEntryDashboard.css'; // Reusing dashboard styles for consistency

const PendingProjects = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPending = async () => {
            try {
                // In real app, pass status='pending'
                const response = await getProjects({ status: 'pending' });
                setProjects(response.data.data || []);
            } catch (error) {
                console.error("Error fetching pending projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPending();
    }, []);

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div>
                        <h1>Pending Projects</h1>
                        <p style={{ color: '#64748b' }}>Review and manage project submissions currently awaiting approval.</p>
                    </div>
                </header>

                <div className="recent-activity" style={{ minHeight: '600px' }}>
                    {/* Reuse Activity Table for consistency */}
                    <table className="activity-table">
                        <thead>
                            <tr>
                                <th>Project Name</th>
                                <th>Location</th>
                                <th>Total Units</th>
                                <th>Date Created</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan="6">Loading...</td></tr> : projects.map((project) => (
                                <tr key={project.id}>
                                    <td><strong>{project.project_name}</strong></td>
                                    <td>{project.location}</td>
                                    <td>{project.total_units || 'N/A'}</td>
                                    <td>{new Date(project.created_at).toLocaleDateString()}</td>
                                    <td><span className="status-badge pending">Pending</span></td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn-action" onClick={() => navigate(`/data-entry/project/${project.id}`)}>Manage</button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && projects.length === 0 && <tr><td colSpan="6">No pending projects.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PendingProjects;
