import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getProjects, deleteProject as deleteProjectAPI, getProjectLocations, filterAPI } from "../../services/api";
import { indianCities } from "../../utils/indianLocations";
import ReportGenerator from "./ReportGenerator";
import "./projects.css";
import usePermissions from '../../hooks/usePermissions';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const { can, isModuleUser, isProjectUser, projectId, projectName, hasProjectAccess, assignedProjectIds, projectsAccess } = usePermissions();
  // isRestrictedProjectUser: either a project_user OR a module_user with specific project assignments
  const isRestrictedProjectUser = isProjectUser || (isModuleUser && projectsAccess && projectsAccess.length > 0);
  // Stable string key to avoid infinite re-render from array reference changes
  const assignedProjectIdsKey = JSON.stringify(assignedProjectIds || []);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [availableLocations, setAvailableLocations] = useState(["All"]);
  const [quotaInfo, setQuotaInfo] = useState(null); // { project_limit, current_count, remaining }

  const [types, setTypes] = useState(["All"]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Report columns for Projects - All sections
  const projectReportColumns = [
    // Basic Info
    { key: 'id', label: 'Project ID' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'project_code', label: 'Project Code' },
    // Location
    { key: 'location', label: 'Location/City' },
    { key: 'state', label: 'State' },
    { key: 'address', label: 'Address' },
    { key: 'pincode', label: 'Pincode' },
    // Property Details
    { key: 'project_type', label: 'Project Type' },
    { key: 'property_status', label: 'Property Status' },
    { key: 'construction_status', label: 'Construction Status' },
    // Area & Units
    { key: 'total_units', label: 'Total Units' },
    { key: 'total_floors', label: 'Total Floors' },
    { key: 'actual_total_floors', label: 'Actual Floors' },
    { key: 'total_project_area', label: 'Total Area' },
    { key: 'total_built_up_area', label: 'Built-up Area' },
    { key: 'total_carpet_area', label: 'Carpet Area' },
    { key: 'calculation_type', label: 'Calculation Basis' },
    // Occupancy
    { key: 'occupied_units', label: 'Occupied Units' },
    { key: 'leased_units', label: 'Leased Units' },
    { key: 'vacant_units', label: 'Vacant Units' },
    // Additional
    { key: 'status', label: 'Status' },
    { key: 'description', label: 'Description' },
    { key: 'project_image', label: 'Project Image' },
    { key: 'created_at', label: 'Created Date' },
    { key: 'updated_at', label: 'Updated Date' }
  ];

  /* ================= FETCH LOCATIONS ================= */
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getProjectLocations();
        const apiLocations = response.data || [];
        const unique = [...new Set([...apiLocations, ...indianCities])].sort();
        setAvailableLocations(["All", ...unique]);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setAvailableLocations(["All", ...indianCities]);
      }
    };

    const fetchTypes = async () => {
      try {
        const response = await filterAPI.getFilterOptions("project_type");
        const apiTypes = response.data.data.map(t => t.option_value);
        setTypes(["All", ...apiTypes]);
      } catch (error) {
        console.error("Error fetching types:", error);
        setTypes(["All", "RETAIL/SHOP", "Commercial", "Industrial", "Mixed Use"]);
      }
    };

    // Fetch quota (only for full company admins)
    const fetchQuota = async () => {
      try {
        const token = sessionStorage.getItem('company_token') || sessionStorage.getItem('token');
        const apiBase = process.env.REACT_APP_API_URL || '/api';
        const base = apiBase.endsWith('/api') ? apiBase.replace(/\/api$/, '') : apiBase;
        const res = await fetch(`${base}/api/projects/quota`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setQuotaInfo(data);
        }
      } catch (e) { /* quota is optional */ }
    };

    fetchLocations();
    fetchTypes();
    if (!isRestrictedProjectUser) fetchQuota();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= FETCH PROJECTS ================= */
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const params = {};

        // Project users can only see their assigned project
        if (isProjectUser && projectId) {
          params.projectId = projectId;
        } else if (!isRestrictedProjectUser) {
          // Full admins: apply search/location/type filters
          if (search) params.search = search;
          if (location !== "All") params.location = location;
          if (type !== "All") params.type = type;
        }
        // For module_user with projects_access: fetch all then filter client-side

        const response = await getProjects(params);
        let projectData = response.data.data || response.data;

        // Filter for project_user (single project)
        if (isProjectUser && projectId) {
          projectData = projectData.filter(p => hasProjectAccess(p.id));
        }

        // Filter for module_user with specific project assignments
        if (isModuleUser && assignedProjectIds && assignedProjectIds.length > 0) {
          const assignedSet = new Set(assignedProjectIds.map(id => String(id)));
          projectData = projectData.filter(p => assignedSet.has(String(p.id)));
        }

        setProjects(projectData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchProjects();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location, type, isProjectUser, isModuleUser, projectId, assignedProjectIdsKey]);

  /* ================= HANDLERS ================= */
  const handleSearch = (e) => setSearch(e.target.value);

  // eslint-disable-next-line no-unused-vars
  const cycleLocation = () => {
    const currentIndex = availableLocations.indexOf(location);
    const nextIndex = (currentIndex + 1) % availableLocations.length;
    setLocation(availableLocations[nextIndex]);
  };

  // eslint-disable-next-line no-unused-vars
  const cycleType = () => {
    const currentIndex = types.indexOf(type);
    const nextIndex = (currentIndex + 1) % types.length;
    setType(types[nextIndex]);
  };

  const clearFilters = () => {
    setSearch("");
    setLocation("All");
    setType("All");
  };

  /* ================= DELETE PROJECT ================= */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProjectAPI(id);
        const filtered = projects.filter(project => project.id !== id);
        setProjects(filtered);
        setMessage({ text: 'Project deleted successfully', type: 'success' });
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } catch (error) {
        console.error("Error deleting project:", error);
        setMessage({
          text: error.response?.data?.error || "Failed to delete project",
          type: 'error'
        });
        // Clear message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      }
    }
  };

  /* ================= EXPORT CSV ================= */
  const handleExportCSV = () => {
    if (projects.length === 0) return;
    const headers = ["Project ID", "Project Name", "Location", "State", "Address", "Type", "Total Units", "Total Floors", "Total Area", "Calculation Basis", "Status", "Description", "Created Date"];
    const rows = projects.map(p => [
      `P-${p.id}`,
      p.project_name,
      p.location,
      p.state || 'N/A',
      p.address || 'N/A',
      p.project_type,
      p.total_units || 0,
      p.total_floors || 0,
      p.total_project_area || 'N/A',
      p.calculation_type || 'N/A',
      p.status || 'Active',
      (p.description || 'N/A').substring(0, 100),
      p.created_at ? new Date(p.created_at).toLocaleDateString() : 'N/A'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(r => r.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "projects_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-text">
            <h1>{isRestrictedProjectUser ? (isProjectUser ? `Project: ${projectName || 'Assigned Project'}` : 'Assigned Projects') : 'Projects'}</h1>
            <p>{isRestrictedProjectUser ? 'You can only access your assigned project(s). Other projects are restricted.' : 'Manage your commercial properties and business spaces'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isRestrictedProjectUser && (
              <>
                <button onClick={handleExportCSV} className="secondary-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export CSV
                </button>
                <button onClick={() => setShowReportModal(true)} className="secondary-btn" style={{ background: '#eff6ff', color: '#2e66ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Generate Report
                </button>
              </>
            )}
            {/* Restricted users (project_user / module_user with project access) cannot add new projects */}
            {!isRestrictedProjectUser && (can('edit') ? (
              <Link to="/admin/add-project" className="primary-btn" style={{ textDecoration: "none", display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Add Project
              </Link>
            ) : (
              <button className="primary-btn" disabled title="No permission to add projects" style={{ opacity: 0.5, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>🔒 Add Project</button>
            ))}
          </div>
        </header>

        {/* ── Project Quota Banner (company admins only) ────────────────────── */}
        {!isRestrictedProjectUser && quotaInfo && quotaInfo.project_limit && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', borderRadius: 8, marginBottom: 16,
            background: quotaInfo.remaining === 0 ? 'rgba(248,113,113,0.1)' : quotaInfo.remaining <= 2 ? 'rgba(251,191,36,0.1)' : 'rgba(99,102,241,0.07)',
            border: `1px solid ${quotaInfo.remaining === 0 ? '#fca5a5' : quotaInfo.remaining <= 2 ? '#fde68a' : 'rgba(99,102,241,0.2)'}`,
          }}>
            <span style={{ fontSize: 18 }}>{quotaInfo.remaining === 0 ? '🚫' : quotaInfo.remaining <= 2 ? '⚠️' : '📊'}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: quotaInfo.remaining === 0 ? '#dc2626' : 'var(--text-primary, #1e293b)' }}>
                Projects: {quotaInfo.current_count} / {quotaInfo.project_limit} used
                {quotaInfo.remaining > 0 && <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 8 }}>({quotaInfo.remaining} slot{quotaInfo.remaining !== 1 ? 's' : ''} remaining)</span>}
                {quotaInfo.remaining === 0 && <span style={{ marginLeft: 8 }}>— Limit reached. Contact your Super Admin to increase the quota.</span>}
              </div>
              <div style={{ height: 4, borderRadius: 3, background: '#e2e8f0', marginTop: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: quotaInfo.remaining === 0 ? '#ef4444' : quotaInfo.remaining <= 2 ? '#f59e0b' : '#6366f1', width: `${Math.min(100, (quotaInfo.current_count / quotaInfo.project_limit) * 100)}%`, transition: 'width 0.4s' }} />
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div style={{
            marginBottom: '10px',
            color: message.type === 'success' ? '#166534' : '#ef4444',
            fontWeight: '500',
            fontSize: '0.95rem'
          }}>
            {message.text}
          </div>
        )}

        <div className="content-card">
          {/* Filters - Hidden for restricted users */}
          {!isRestrictedProjectUser && (
            <div className="filters-bar">
              <div className="search-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search projects by key name, city, or ID..."
                  value={search}
                  onChange={handleSearch}
                />
              </div>
              <div className="filter-actions">
                <div className="select-wrapper">
                  <span className="select-label">Location:</span>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="filter-select">
                    {availableLocations.map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                  </select>
                </div>
                <div className="select-wrapper">
                  <span className="select-label">Type:</span>
                  <select value={type} onChange={(e) => setType(e.target.value)} className="filter-select">
                    {types.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                </div>
                <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
              </div>
            </div>
          )}

          {/* Info banner for restricted project access */}
          {isRestrictedProjectUser && (
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e66ff" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <div>
                <div style={{ fontWeight: '600', color: '#1e40af' }}>Project-Specific Access</div>
                <div style={{ fontSize: '0.85rem', color: '#3b82f6' }}>You can only access your assigned project(s). Other projects are restricted.</div>
              </div>
            </div>
          )}

          {/* ================= TABLE ================= */}
          <div className="table-responsive">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Location</th>
                  <th>Total Units / Floors</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>Loading projects...</td>
                  </tr>
                )}
                {!loading && projects.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>No projects found.</td>
                  </tr>
                )}
                {!loading && projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <div className="project-info-cell">
                        <div className="project-icon-wrapper">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </div>
                        <div>
                          <Link to={`/admin/projects/${project.id}`} className="project-name" style={{ textDecoration: 'none', color: 'inherit', fontWeight: '600' }}>
                            {project.project_name}
                          </Link>
                          <div className="project-id">
                            ID: P-{project.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="text-secondary">
                      {project.location}
                    </td>

                    <td>
                      <div className="units-cell">
                        <span className="unit-count">
                          {project.total_units || 0} Units<br />
                          <small style={{ fontSize: '0.8rem', color: '#64748b' }}>{project.total_floors || 0} Floors</small>
                        </span>
                        <span className="occupancy-label">
                          {project.occupied_units !== undefined || project.leased_units !== undefined
                            ? `${project.occupied_units ?? project.leased_units ?? 0} / ${project.total_units || 0} Leased`
                            : (project.total_units > 0 ? 'View Details' : 'New Construction')}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`status-badge ${project.status || 'active'}`}>
                        {project.status || 'Active'}
                      </span>
                    </td>

                    <td>
                      <div className="action-icon-wrapper right">
                        <Link to={`/admin/projects/${project.id}`} className="action-icon-btn view" title="View Details">
                          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                        {can('edit') ? (
                          <Link to={`/admin/add-unit?projectId=${project.id}`} className="action-icon-btn add-unit-btn" title="Add Unit" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #10b981', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '700', lineHeight: '1', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }} onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; }}>
                            +
                          </Link>
                        ) : (
                          <button disabled title="No permission to add units" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f3f4f6', border: '2px solid #d1d5db', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', cursor: 'not-allowed', flexShrink: 0 }}>🔒</button>
                        )}
                        {can('edit') ? (
                          <Link to={`/admin/edit-project/${project.id}`} className="action-icon-btn edit" title="Edit">
                            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </Link>
                        ) : (
                          <button className="action-icon-btn" disabled title="No edit permission" style={{ opacity: 0.4, cursor: 'not-allowed', fontSize: '14px' }}>🔒</button>
                        )}
                        {can('delete') ? (
                          <button className="action-icon-btn delete" onClick={() => handleDelete(project.id)} title="Delete">
                            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        ) : (
                          <button className="action-icon-btn" disabled title="No delete permission" style={{ opacity: 0.4, cursor: 'not-allowed', fontSize: '14px' }}>🔒</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination (Static Demo) */}
          <div className="pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            <div className="showing-text" style={{ color: '#64748b', fontSize: '0.85rem' }}>
              Showing {projects.length > 0 ? `1 to ${projects.length}` : '0'} of {projects.length} results
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', color: '#64748b', cursor: 'pointer' }} disabled>&lt;</button>
              <button style={{ padding: '6px 12px', border: '1px solid #2e66ff', background: '#2e66ff', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>1</button>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', color: '#64748b', cursor: 'pointer' }}>2</button>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', color: '#64748b', cursor: 'pointer' }}>...</button>
              <button style={{ padding: '6px 12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '6px', color: '#64748b', cursor: 'pointer' }}>&gt;</button>
            </div>
          </div>

        </div>
      </main>

      {showReportModal && (
        <ReportGenerator
          title="Projects Report"
          data={projects}
          columns={projectReportColumns}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default Projects;
