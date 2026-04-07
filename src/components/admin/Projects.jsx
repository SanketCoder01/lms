import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getProjects, deleteProject as deleteProjectAPI, getProjectLocations, filterAPI } from "../../services/api";
import { indianCities } from "../../utils/indianLocations";
import "./projects.css";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All");
  const [type, setType] = useState("All");
  const [availableLocations, setAvailableLocations] = useState(["All"]);

  const [types, setTypes] = useState(["All"]);

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

    fetchLocations();
    fetchTypes();
  }, []);

  /* ================= FETCH PROJECTS ================= */
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const params = {};
        if (search) params.search = search;
        if (location !== "All") params.location = location;
        if (type !== "All") params.type = type;

        const response = await getProjects(params);
        setProjects(response.data.data || response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchProjects();
    }, 500);

    return () => clearTimeout(timer);
  }, [search, location, type]);

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
    const headers = ["Project Name", "Location", "Type", "Total Units", "Available Units", "Status"];
    const rows = projects.map(p => [
      p.project_name,
      p.location,
      p.project_type,
      p.total_units || 0,
      p.available_units || 0,
      p.status || 'Active'
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
            <h1>Projects</h1>
            <p>Manage your commercial properties and business spaces</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportCSV} className="secondary-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export CSV
            </button>
            <Link
              to="/admin/add-project"
              className="primary-btn"
              style={{ textDecoration: "none", display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Project
            </Link>
          </div>
        </header>

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
          {/* Filters */}
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
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="filter-select"
                >
                  {availableLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="select-wrapper">
                <span className="select-label">Type:</span>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="filter-select"
                >
                  {types.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
            </div>
          </div>

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
                        <Link
                          to={`/admin/projects/${project.id}`}
                          className="action-icon-btn view"
                          title="View Details"
                        >
                          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                        <Link
                          to={`/admin/add-unit?projectId=${project.id}`}
                          className="action-icon-btn add-unit-btn"
                          title="Add Unit"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#f0fdf4',
                            border: '2px solid #10b981',
                            color: '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: '700',
                            lineHeight: '1',
                            textDecoration: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#10b981'; }}
                        >
                          +
                        </Link>
                        <Link
                          to={`/admin/edit-project/${project.id}`}
                          className="action-icon-btn edit"
                          title="Edit"
                        >
                          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Link>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => handleDelete(project.id)}
                          title="Delete"
                        >
                          <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
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
    </div>
  );
};

export default Projects;
