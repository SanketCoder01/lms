import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ownerAPI, unitAPI, FILE_BASE_URL } from '../../services/api'; // Import unitAPI
import './OwnerDetails.css';

const OwnerDetails = () => {
  const { id } = useParams();
  const [owner, setOwner] = useState(null);
  const [units, setUnits] = useState([]);
  const [documents, setDocuments] = useState([]); // State for documents
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('units'); // State for active tab
  const [uploading, setUploading] = useState(false); // State for upload status
  const fileInputRef = useRef(null); // Ref for file input

  // Modal State
  const [isAddUnitModalOpen, setIsAddUnitModalOpen] = useState(false);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [unitSearch, setUnitSearch] = useState('');

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const response = await ownerAPI.getOwnerById(id);
      const data = response.data.data || response.data;

      if (data.owner) {
        setOwner(data.owner);
        setUnits(data.units || []);
      } else {
        setOwner(data);
      }

      // Fetch Documents
      const docsResponse = await ownerAPI.getDocuments(id);
      setDocuments(docsResponse.data || []);

    } catch (err) {
      console.error("Error fetching owner details:", err);
      setError("Failed to load owner details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Fetch available units when modal opens
  useEffect(() => {
    if (isAddUnitModalOpen) {
      const fetchUnits = async () => {
        try {
          const response = await unitAPI.getUnits({ status: 'vacant' });
          setAvailableUnits(response.data.data || response.data || []);
        } catch (err) {
          console.error("Failed to fetch units:", err);
        }
      };
      fetchUnits();
      setSelectedUnitIds([]);
      setUnitSearch('');
    }
  }, [isAddUnitModalOpen]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', 'General'); // Default type

    try {
      setUploading(true);
      await ownerAPI.uploadDocument(id, formData);
      // Refresh documents
      const docsResponse = await ownerAPI.getDocuments(id);
      setDocuments(docsResponse.data || []);
      alert('Document uploaded successfully');
    } catch (err) {
      console.error("Upload failed", err);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleUnitSelection = (unitId) => {
    setSelectedUnitIds(prev =>
      prev.includes(unitId)
        ? prev.filter(id => id !== unitId)
        : [...prev, unitId]
    );
  };

  const handleAddUnits = async () => {
    if (selectedUnitIds.length === 0) return;

    try {
      await ownerAPI.addUnits(id, { unit_ids: selectedUnitIds });
      setIsAddUnitModalOpen(false);
      fetchDetails(); // Refresh details to show new units
      alert("Units added successfully");
    } catch (err) {
      console.error("Failed to add units:", err);
      alert("Failed to add units. Please try again.");
    }
  };

  const filteredAvailableUnits = availableUnits.filter(u =>
    u.unit_number.toLowerCase().includes(unitSearch.toLowerCase()) ||
    (u.building && u.building.toLowerCase().includes(unitSearch.toLowerCase()))
  );

  if (loading) return <div className="owner-details-container"><Sidebar /><div className="owner-details-content">Loading...</div></div>;
  if (error) return <div className="owner-details-container"><Sidebar /><div className="owner-details-content">{error}</div></div>;
  if (!owner) return <div className="owner-details-container"><Sidebar /><div className="owner-details-content">Owner not found.</div></div>;

  // Calculate Stats
  const totalUnits = units.length;
  const occupiedUnits = units.filter(u => u.status === 'occupied').length;
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

  return (
    <div className="owner-details-container">
      <Sidebar />
      <main className="owner-details-content">
        <div className="breadcrumb">HOME &gt; OWNER &gt; <span style={{ color: '#666' }}>{owner.name?.toUpperCase()}</span></div>

        {/* Profile Header */}
        <header className="owner-profile-header">
          <div className="profile-main">
            <div className="profile-avatar-large">
              <img
                src={`https://ui-avatars.com/api/?name=${owner.name}&background=random`}
                alt={owner.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
              />
            </div>
            <div className="profile-info">
              <h2>{owner.company_name || owner.name}</h2>
              <p>ID: #OWN-{owner.id} | Owner since {new Date(owner.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</p>
            </div>
          </div>
          <div className="header-actions">

            <Link to={`/admin/owner/edit/${owner.id}`} className="btn-edit" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              Edit
            </Link>
            <button className="btn-more">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
          </div>
        </header>

        <div className="details-layout">
          {/* Left Column */}
          <div className="left-column">
            <div className="section-title">Contact Details</div>
            <div className="side-card">
              <div className="contact-item">
                <div className="contact-icon email">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div className="contact-text">
                  <label>Email Address</label>
                  <p>{owner.email}</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon phone">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <div className="contact-text">
                  <label>Phone Number</label>
                  <p>{owner.phone}</p>
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-icon address">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <div className="contact-text">
                  <label>Primary Address</label>
                  <p>{owner.address || 'N/A'}</p>
                </div>
              </div>
              {/* Map Placeholder */}
              <div className="map-placeholder">
                <div className="map-overlay">View Map</div>
              </div>
            </div>

            <div className="section-title">Personal Information</div>
            <div className="side-card">
              <div className="contact-item">
                <div className="contact-icon" style={{ background: '#f3f4f6' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div className="contact-text">
                  <label>Company / Full Name</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p>{owner.company_name || owner.name}</p>
                    <span className="badge-verified">{owner.kyc_status || 'Pending'}</span>
                  </div>
                  {owner.company_name && owner.name && (
                    <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Contact: {owner.name}</span>
                  )}
                </div>
              </div>
              <div className="contact-item">
                <div className="contact-text" style={{ marginLeft: 46 }}>
                  <label>Representative</label>
                  <p>{owner.representative_name || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="right-column">
            {/* Stats Widgets */}
            <div className="stats-row">
              <div className="stat-widget">
                <div className="stat-label">Total Units</div>
                <div className="stat-number">
                  {totalUnits}
                  <span className="stat-change">+0 this year</span>
                </div>
              </div>
              <div className="stat-widget">
                <div className="stat-label">Occupancy Rate</div>
                <div className="stat-number">{occupancyRate}%</div>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${occupancyRate}%` }}></div>
                </div>
              </div>
            </div>

            {/* Tabs & Main Content */}
            <div className="tabs-nav">
              <button
                className={`tab-link ${activeTab === 'units' ? 'active' : ''}`}
                onClick={() => setActiveTab('units')}
              >
                Overview & Units
              </button>
              <button
                className={`tab-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                KYC Documents
              </button>
            </div>

            {/* UNITS TAB */}
            {activeTab === 'units' && (
              <div className="mapped-units-section">
                <div className="mapped-units-header">
                  <h3>Mapped Units</h3>
                  <div className="units-controls">
                    <div className="unit-search">
                      <svg className="search-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input type="text" placeholder="Search units..." />
                    </div>
                    <button className="btn-add-units" onClick={() => setIsAddUnitModalOpen(true)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      Add Units
                    </button>
                  </div>
                </div>

                <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="units-table">
                      <thead>
                        <tr>
                          <th>Unit ID</th>
                          <th>Address/Project</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Rent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.length === 0 ? (
                          <tr><td colSpan="4" style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>No units mapped.</td></tr>
                        ) : (
                          units.map(unit => (
                            <tr key={unit.id}>
                              <td>
                                <div className="unit-id-cell">
                                  <img
                                    src={unit.image_path ? `${FILE_BASE_URL.replace('/api', '')}/${unit.image_path}` : `https://ui-avatars.com/api/?name=${unit.unit_number}&background=random`}
                                    alt="Unit"
                                    className="unit-thumb"
                                  />
                                  <span>{unit.unit_number}</span>
                                </div>
                              </td>
                              <td className="unit-address">
                                <p>{unit.project_name || 'N/A'}</p>
                                <span>{unit.address || 'Project Address'}</span>
                              </td>
                              <td>
                                <span style={{
                                  padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500,
                                  background: unit.status === 'occupied' ? '#dcfce7' : '#fee2e2',
                                  color: unit.status === 'occupied' ? '#166534' : '#991b1b'
                                }}>
                                  {unit.status === 'occupied' ? 'Leased' : 'Vacant'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }} className="rent-val">
                                {unit.rent ? `$${unit.rent}` : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="view-all-link" style={{ padding: '12px 16px', textAlign: 'center', borderTop: '1px solid #e5e7eb', cursor: 'pointer', color: '#2563eb' }}>
                    View all units →
                  </div>
                </div>
              </div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <div className="documents-section">
                <div className="kyc-header">
                  <h3>KYC & Documents</h3>
                  <span className="view-all-docs">View All</span>
                </div>

                <div className="docs-grid">
                  {documents.map((doc) => (
                    <div className="doc-card" key={doc.id}>
                      <div className="doc-icon blue">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      </div>
                      <div className="doc-info">
                        <a
                          href={doc.document_path?.startsWith('http') ? doc.document_path : `${FILE_BASE_URL.replace('/api', '')}/${doc.document_path ? doc.document_path.replace(/\\\\/g, '/') : ''}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="doc-name"
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          {doc.document_type || 'Document'}
                        </a>
                        <span className="doc-date">Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                        <div className="doc-meta">
                          <span className="verified-tag">Uploaded</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="upload-card" onClick={() => fileInputRef.current?.click()}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Units Modal */}
        {isAddUnitModalOpen && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h3>Select Units to Add</h3>
                <button onClick={() => setIsAddUnitModalOpen(false)} className="close-modal-btn">×</button>
              </div>
              <div className="modal-content">
                <div className="unit-filters">
                  <input
                    type="text"
                    placeholder="Search available units..."
                    value={unitSearch}
                    onChange={(e) => setUnitSearch(e.target.value)}
                  />
                </div>
                {availableUnits.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666' }}>No vacant units available.</p>
                ) : (
                  <div className="unit-list">
                    {filteredAvailableUnits.map(unit => (
                      <div
                        key={unit.id}
                        className={`unit-select-item ${selectedUnitIds.includes(unit.id) ? 'selected' : ''}`}
                        onClick={() => toggleUnitSelection(unit.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={() => { }} // Handled by div click
                          style={{ pointerEvents: 'none' }}
                        />
                        <div className="unit-info-modal">
                          <span className="unit-number-modal">Unit {unit.unit_number}</span>
                          <span className="unit-project-modal">{unit.building || unit.project_name || 'Project N/A'}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          {unit.area ? `${unit.area} sqft` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setIsAddUnitModalOpen(false)} className="btn-cancel">Cancel</button>
                <button
                  onClick={handleAddUnits}
                  className="btn-save"
                  disabled={selectedUnitIds.length === 0}
                >
                  Add Selected Units
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default OwnerDetails;
