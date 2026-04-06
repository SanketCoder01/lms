import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getProjectById, unitAPI, FILE_BASE_URL } from '../../services/api';
import './ProjectDetails.css'; // We'll create this CSS file next

const ProjectDetails = () => {
    const { id } = useParams();
    // const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [activeTab, setActiveTab] = useState('home');
    const [units, setUnits] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [imageError, setImageError] = useState(false);

    /* ================= FETCH DATA ================= */
    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                setLoading(true);
                // 1. Fetch Project Info (with stats from backend update)
                const projRes = await getProjectById(id);
                setProject(projRes.data.data || projRes.data);

                // 2. Fetch Units for this project
                const unitsRes = await unitAPI.getUnits({ projectId: id });
                setUnits(unitsRes.data.data || unitsRes.data);

                // tenants and owners are now sent by the backend getProjectById directly
                setTenants(projRes.data.tenants || []);
                setOwners(projRes.data.owners || []);

            } catch (error) {
                console.error("Error fetching project details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProjectDetails();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <p style={{ padding: '20px' }}>Loading project details...</p>
                </main>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <p style={{ padding: '20px' }}>Project not found.</p>
                </main>
            </div>
        );
    }

    /* ================= RENDER SUB-COMPONENTS ================= */
    const renderHomeTab = () => (
        <div className="tab-content-home">
            <div className="details-grid">
                {/* General Info */}
                <div className="detail-card">
                    <h3>General Information</h3>
                    <div className="project-image-container">
                        {project.project_image && !imageError ? (
                            <img
                                src={`${FILE_BASE_URL}/uploads/${project.project_image}`}
                                alt={project.project_name}
                                className="project-main-image"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="project-placeholder-image">
                                {project.project_name ? project.project_name : "No Image Available"}
                            </div>
                        )}
                    </div>
                    <div className="info-group">
                        <label>Project Name</label>
                        <div className="info-value">{project.project_name}</div>
                    </div>
                    <div className="row">
                        <div className="info-group col">
                            <label>Project Code</label>
                            <div className="info-value">P-{project.id}</div>
                        </div>
                        <div className="info-group col">
                            <label>Location</label>
                            <div className="info-value">{project.location}</div>
                        </div>
                    </div>
                    <div className="info-group">
                        <label>Description</label>
                        <div className="info-value description">{project.description || 'No description provided.'}</div>
                    </div>
                </div>

                {/* Side Stats */}
                <div className="detail-card">
                    <h3>Property Stats</h3>
                    <div className="stat-row">
                        <span>Total Floors:</span>
                        <strong>{project.total_floors || project.actual_total_floors || 0}</strong>
                    </div>
                    <div className="stat-row">
                        <span>Total Units:</span>
                        <strong>{project.total_units_count || 0}</strong>
                    </div>
                    <div className="stat-row">
                        <span>Units Sold:</span>
                        <strong>{project.units_sold || 0}</strong>
                    </div>
                    <div className="stat-row">
                        <span>Leased Units:</span>
                        <strong>{project.occupied_units || 0}</strong>
                    </div>
                    <div className="stat-row">
                        <span>Vacant Units:</span>
                        <strong>{project.vacant_units || 0}</strong>
                    </div>
                    <div className="stat-row">
                        <span>Total Area:</span>
                        <strong>{project.total_area || 0} sqft</strong>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderUnitsTab = () => (
        <div className="tab-content-table">
            <div className="table-actions-bar">
                <div className="search-box">
                    <input type="text" placeholder="Search units..." />
                </div>
            </div>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Unit No</th>
                        <th>Floor</th>
                        <th>Area (sqft)</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {units.length === 0 ? (
                        <tr><td colSpan="5">No units found for this project.</td></tr>
                    ) : (
                        units.map(unit => (
                            <tr key={unit.id}>
                                <td>{unit.unit_number}</td>
                                <td>{unit.floor_number}</td>
                                <td>{unit.chargeable_area}</td>
                                <td><span className={`status-badge ${unit.status}`}>{unit.status}</span></td>
                                <td>
                                    <Link to={`/admin/edit-unit/${unit.id}`} className="action-link">Edit</Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderTenantsTab = () => (
        <div className="tab-content-table">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Company Name</th>
                        <th>Contact Person</th>
                        <th>Email</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.length === 0 ? (
                        <tr><td colSpan="4">No tenants found for this project.</td></tr>
                    ) : (
                        tenants.map(tenant => (
                            <tr key={tenant.id}>
                                <td>{tenant.company_name}</td>
                                <td>{tenant.contact_person_name || 'N/A'}</td>
                                <td>{tenant.contact_person_email}</td>
                                <td><span className={`status-badge ${tenant.status}`}>{tenant.status}</span></td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderOwnersTab = () => (
        <div className="tab-content-table">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Owner Name</th>
                        <th>Entity Type</th>
                        <th>Email</th>
                        <th>Phone</th>
                    </tr>
                </thead>
                <tbody>
                    {owners.length === 0 ? (
                        <tr><td colSpan="4">No owners found for this project.</td></tr>
                    ) : (
                        owners.map(owner => (
                            <tr key={owner.id}>
                                <td>{owner.first_name} {owner.last_name}</td>
                                <td>{owner.legal_entity_type || owner.type}</td>
                                <td>{owner.email}</td>
                                <td>{owner.phone}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                {/* Header */}
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/projects">PROJECTS</Link> &gt; <span className="active">{project.project_name.toUpperCase()}</span>
                        </div>
                        <div className="title-row">
                            <h1>{project.project_name}</h1>
                            <span className={`status-badge ${project.status}`}>{project.status}</span>
                        </div>
                        <div className="project-meta">
                            <span>{project.location}</span>
                        </div>
                    </div>
                    <div className="header-actions">
                        <Link to={`/admin/edit-project/${project.id}`} className="secondary-btn">Edit Project</Link>
                        <Link to={`/admin/add-unit?projectId=${project.id}`} className="primary-btn">+ Add Unit</Link>
                    </div>
                </header>

                {/* Metrics Banner */}
                <div className="metrics-banner">
                    <div className="metric-card">
                        <div className="metric-label">Leased Units</div>
                        <div className="metric-value">
                            {project.occupied_units || 0} / {project.total_units || 0} <span className="metric-sub">Units</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${project.total_units ? (project.occupied_units / project.total_units) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="metric-card">
                        <div className="metric-label">Leased Area</div>
                        <div className="metric-value">
                            {project.leased_area || 0} / {project.total_area || 0} <span className="metric-sub">sqft</span>
                        </div>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${project.total_area ? (project.leased_area / project.total_area) * 100 : 0}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container">
                    <div className="tabs-header">
                        <button
                            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
                            onClick={() => setActiveTab('home')}
                        >
                            Home
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'units' ? 'active' : ''}`}
                            onClick={() => setActiveTab('units')}
                        >
                            Units ({units.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'tenants' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tenants')}
                        >
                            Tenants ({tenants.length})
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'owner' ? 'active' : ''}`}
                            onClick={() => setActiveTab('owner')}
                        >
                            Owner
                        </button>
                    </div>

                    <div className="tab-body">
                        {activeTab === 'home' && renderHomeTab()}
                        {activeTab === 'units' && renderUnitsTab()}
                        {activeTab === 'tenants' && renderTenantsTab()}
                        {activeTab === 'owner' && renderOwnersTab()}
                    </div>
                </div>

            </main>
        </div>
    );
};

export default ProjectDetails;
