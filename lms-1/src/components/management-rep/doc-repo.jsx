import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import RepSidebar from "./RepSidebar";
import { managementAPI } from "../../services/api";
import "../admin/dashboard.css"; // Shared dashboard styles
import "./DocumentRepository.css";

const DocumentRepository = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterCategory]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterCategory) params.category = filterCategory;

      const res = await managementAPI.getDocuments(params);
      const list = res.data.data || res.data || [];
      setDocuments(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    document.getElementById('file-upload').click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      // Mock category for now or trigger modal
      formData.append('category', 'General');

      await managementAPI.uploadDocument(formData);
      // Optimistic or re-fetch
      alert('File uploaded successfully');
      fetchDocuments();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  return (
    <div className="dashboard-container">
      <RepSidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">
              <Link to="/management/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt; <span className="active">DOCUMENTS</span>
            </div>
            <h1>Document Repository</h1>
            <p>Securely manage and organize all property-related files.</p>
          </div>
        </header>

        {/* Upload Zone */}
        <div className="upload-zone-container">
          <div className="drag-drop-area">
            <div className="icon-circle-large">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <h3>Upload New Document</h3>
            <p>Drag & drop files here, or click to browse</p>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button className="primary-btn" onClick={handleUploadClick}>
              Browse Files
            </button>
          </div>
        </div>

        <div className="content-card">
          {/* Filters Bar */}
          <div className="filters-bar">
            <div className="search-wrapper">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search by file name or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-actions">
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Lease">Lease Agreements</option>
                  <option value="Legal">Legal</option>
                  <option value="Invoices">Invoices</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
                <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>

              {/* File Type Filter (Mocked for now) */}
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  style={{ minWidth: '120px' }}
                >
                  <option value="">File Type</option>
                  <option value="pdf">PDF</option>
                  <option value="jpg">JPG/PNG</option>
                  <option value="docx">DOCX</option>
                </select>
                <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>

              {/* Upload Date Filter (Mocked) */}
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  style={{ minWidth: '130px' }}
                >
                  <option value="">Upload Date</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                </select>
                <svg className="chevron-down" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Details</th>
                  <th>Category</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>Loading documents...</td>
                  </tr>
                )}
                {!loading && documents.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>No documents found</td>
                  </tr>
                )}
                {!loading && documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div className="project-name-cell">
                        <div className="project-icon-placeholder">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </div>
                        <div className="file-info">
                          <h4>{doc.name || doc.projectName || 'Untitled Document'}</h4>
                          <span>{doc.projectName || 'General Project'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="status-badge approved">
                        {doc.category || 'General'}
                      </span>
                    </td>
                    <td>{doc.uploadedBy || 'Admin'}</td>
                    <td>{formatDate(doc.date || doc.createdAt)}</td>
                    <td>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button className="action-btn" title="Download">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                        </button>
                        <button className="action-btn delete" title="Delete">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span>Showing {documents.length} results</span>
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

export default DocumentRepository;
