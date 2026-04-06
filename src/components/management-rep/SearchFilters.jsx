import React, { useState } from "react";
import RepSidebar from "./RepSidebar";
import { managementAPI } from "../../services/api";
import "./SearchFilters.css";

const SearchFilters = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    owner_name: "",
    tenant_name: "",
    unit_number: "",
    status: "",
    start_date: "",
    end_date: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // eslint-disable-next-line no-unused-vars
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Filter out empty keys
      const params = Object.fromEntries(
        Object.entries(formData).filter(([_, v]) => v !== "")
      );

      // eslint-disable-next-line no-unused-vars
      const res = await managementAPI.get("search", { params }); // Using generic get for now if custom method not added yet to api object
      // Actually managementAPI doesn't have a 'search' method explicitly defined in the file I read, 
      // but I can add it or use a raw API call.
      // better: use API.get directly if managementAPI is restrictive, but let's assume I add it or use a relative path
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Custom fetch to avoid modifying api.js again if possible, or just add it
  const executeSearch = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(formData).toString();
      // We added /search to management routes, so it's /api/management/search
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://lms-sepia-mu.vercel.app/api'}/management/search?${query}`);
      const data = await response.json();
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Search error", error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFormData({
      project_name: "",
      owner_name: "",
      tenant_name: "",
      unit_number: "",
      status: "",
      start_date: "",
      end_date: ""
    });
    setResults([]);
  };

  return (
    <div className="dashboard-container">
      <RepSidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <h1>Search & Filters</h1>
            <p>Advanced search across all properties and records.</p>
          </div>
        </header>

        {/* ADVANCED FILTER SECTION */}
        <div className="content-card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Advanced Filter</h3>
          <div className="advanced-filter-grid">
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} placeholder="e.g. Sunset Apartments" />
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input type="text" name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="e.g. John Doe" />
            </div>
            <div className="form-group">
              <label>Tenant Name</label>
              <input type="text" name="tenant_name" value={formData.tenant_name} onChange={handleChange} placeholder="e.g. Tech Corp" />
            </div>
            <div className="form-group">
              <label>Unit Number</label>
              <input type="text" name="unit_number" value={formData.unit_number} onChange={handleChange} placeholder="e.g. 101" />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="filter-select" style={{ width: '100%' }}>
                <option value="">Any Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lease Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Lease End Date</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} />
            </div>
          </div>
          <div className="filter-buttons" style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button className="primary-btn" onClick={executeSearch}>Apply Filter</button>
            <button className="white-btn" onClick={clearFilters}>Clear</button>
          </div>
        </div>

        <div className="content-card">
          <h3>Results ({results.length})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project / Name</th>
                  <th>ID / Detail</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Searching...</td></tr>}
                {!loading && results.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>No results found.</td></tr>}
                {!loading && results.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.project_name !== 'N/A' ? item.project_name : item.name}</td>
                    <td>{item.id_label}</td>
                    <td>
                      <span className="status-badge" style={{ background: '#e2e8f0', color: '#4a5568' }}>{item.category}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${item.status ? item.status.toLowerCase() : 'active'}`}>
                        {item.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SearchFilters;
