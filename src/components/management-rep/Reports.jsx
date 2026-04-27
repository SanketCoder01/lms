import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RepSidebar from "./RepSidebar";
import { managementAPI, getProjects, partyAPI } from "../../services/api";
import "./Reports.css";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lists for Dropdowns
  const [projectsList, setProjectsList] = useState([]);
  const [ownersList, setOwnersList] = useState([]);
  const [tenantsList, setTenantsList] = useState([]);

  // Filter States
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Fetch dropdown options on mount
    const fetchOptions = async () => {
      try {
        const [pRes, partyRes] = await Promise.all([
          getProjects(),
          partyAPI.getAllParties()
        ]);
        setProjectsList(pRes.data.data || pRes.data || []);

        const allParties = partyRes.data || [];
        setOwnersList(allParties); // Assuming user wants all masters in dropdown
        setTenantsList(allParties);
      } catch (err) {
        console.error("Error fetching filter options:", err);
      }
    };
    fetchOptions();
  }, []);

  const fetchReports = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (selectedProject) params.project_id = selectedProject;
      if (selectedOwner) params.owner_id = selectedOwner;
      if (selectedTenant) params.tenant_id = selectedTenant;
      if (searchQuery) params.search = searchQuery;

      const res = await managementAPI.getReports(params);
      // Handle both { data: [...] } and { data: { data: [...] } } patterns depending on backend wrapper
      const list = res.data.data || res.data || [];
      setReports(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedOwner, selectedTenant, searchQuery]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExport = async () => {
    try {
      const res = await managementAPI.exportReports({
        search: searchQuery,
        project_id: selectedProject,
        owner_id: selectedOwner,
        tenant_id: selectedTenant
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to export reports:", err);
      alert("Failed to export reports");
    }
  };

  return (
    <div className="dashboard-container">
      <RepSidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">
              <Link to="/management/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt; <span className="active">REPORTS</span>
            </div>
            <h1>Management Reports</h1>
            <p>View and download financial and operational reports.</p>
          </div>
          <button className="export-report-btn" onClick={handleExport}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Export All
          </button>
        </header>

        <div className="content-card">
          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="filter-group">
              <div className="search-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Project Filter */}
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '150px' }}
                >
                  <option value="">All Projects</option>
                  {projectsList.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              {/* Owner Filter */}
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '150px' }}
                >
                  <option value="">All Owners</option>
                  {ownersList.map(o => (
                    <option key={o.id} value={o.id}>
                      {o.company_name || `${o.first_name} ${o.last_name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant Filter */}
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  value={selectedTenant}
                  onChange={(e) => setSelectedTenant(e.target.value)}
                  style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '150px' }}
                >
                  <option value="">All Masters</option>
                  {tenantsList.map(t => (
                    <option key={t.id} value={t.id}>{t.company_name}</option>
                  ))}
                </select>
              </div>

            </div>
            <div className="filter-date-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              Last 30 Days
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>Loading reports...</td>
                  </tr>
                )}
                {!loading && reports.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No reports found</td>
                  </tr>
                )}
                {!loading && reports.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ebf8ff', padding: '8px', borderRadius: '6px', color: '#2b6cb0' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: '#2d3748' }}>{r.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#718096' }}>ID: {r.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{r.date}</td>
                    <td>{r.type}</td>
                    <td>
                      <span className={`status-badge ${r.status ? r.status.toLowerCase() : 'ready'}`}>
                        {r.status || 'Ready'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" title="Download">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <span>Showing {reports.length} results</span>
            <div className="page-nav">
              <button disabled>&lt;</button>
              <span>1</span>
              <button>&gt;</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Reports;
