import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ownerAPI } from '../../services/api';
import { indianCities } from '../../utils/indianLocations';
import './OwnerList.css';

const OwnerList = () => {
  // const navigate = useNavigate();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('All');
  const [locations, setLocations] = useState(['All']);
  // eslint-disable-next-line no-unused-vars
  const [successMsg, setSuccessMsg] = useState(''); // New state for toast

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOwners();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, location]);

  const fetchLocations = async () => {
    try {
      const res = await ownerAPI.getOwnerLocations();
      const apiLocations = res.data || [];
      const unique = [...new Set([...apiLocations, ...indianCities])].sort();
      setLocations(['All', ...unique]);
    } catch (error) {
      console.error("Failed to fetch locations");
      setLocations(['All', ...indianCities]);
    }
  };

  const fetchOwners = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (location && location !== 'All') params.location = location;

      const res = await ownerAPI.getOwners(params);
      setOwners(res.data.data || res.data || []);
    } catch (error) {
      console.error("Failed to fetch owners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
      if (window.confirm('Are you sure you want to delete this owner?')) {
          try {
              await ownerAPI.deleteOwner(id);
              const deletedOwner = owners.find(o => o.id === id);
              setOwners(owners.filter(owner => owner.id !== id));

              // Show success message
              setSuccessMsg(`Owner ${deletedOwner ? deletedOwner.name : ''} deleted successfully.`);
              // Clear after 3 seconds
              setTimeout(() => setSuccessMsg(''), 3000);

          } catch (error) {
              console.error("Failed to delete owner", error);
              alert("Failed to delete owner. They might be linked to active leases.");
          }
      }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">
              <Link to="/admin/dashboard">HOME</Link> &gt; <span className="active">OWNERS</span>
            </div>
            <h1>Owner Management</h1>
            <p>Manage property owners and their details.</p>
          </div>
          <Link to="/admin/owner/add" className="primary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Owner
          </Link>
        </header>

        <div className="content-card">
          {/* Filters Bar */}
          <div className="filters-bar" style={{ display: 'flex', gap: '16px', padding: '16px', borderBottom: '1px solid #e2e8f0', alignItems: 'center' }}>
            <div className="search-wrapper" style={{ flex: 1, maxWidth: '400px', position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: '12px', color: '#64748b' }}
              >
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search by name, email or mobile..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  background: '#f1f5f9'
                }}
              />
            </div>

            <button className="clear-btn" style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setSearch(''); setLocation('All'); }}>
              Clear filters
            </button>

            {/* Location Dropdown */}
            <div className="filter-group" style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', outline: 'none', cursor: 'pointer' }}
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc === 'All' ? 'Location: All' : loc}</option>
                ))}
              </select>

            </div>
          </div>

          {/* Success Toast */}
          {successMsg && (
            <div style={{
              padding: '12px 20px',
              margin: '0 16px 16px',
              backgroundColor: '#dcfce7',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              {successMsg}
            </div>
          )}

          <div className="owner-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Owner Name</th>
                  <th>Contact Info</th>
                  <th>GST No</th>
                  <th>Total Area (sq ft)</th>
                  <th>KYC Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="6" className="empty-state">Loading owners...</td></tr>
                )}
                {!loading && owners.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No owners found. Click "Add Owner" to create one.
                    </td>
                  </tr>
                )}
                {!loading && owners.map((owner) => (
                  <tr key={owner.id}>
                    <td>
                      <div className="owner-info-col">
                        <div className="owner-avatar">
                          {owner.name.charAt(0)}
                        </div>
                        <div className="owner-details">
                          <div className="owner-name" style={{ fontWeight: 600 }}>{owner.name}</div>
                          <div className="owner-id" style={{ fontSize: '0.75rem', color: '#64748b' }}>ID: #OWN-{owner.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="owner-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                          <span>{owner.phone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          <span className="owner-email">{owner.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{owner.gst_number || 'N/A'}</td>
                    <td style={{ fontWeight: 500 }}>
                      {owner.total_owned_area ? owner.total_owned_area.toLocaleString() : '0'}
                    </td>
                    <td>
                      <span className={`status-badge ${owner.kyc_status || 'pending'}`}>
                        {owner.kyc_status === 'verified' && <span style={{ marginRight: '4px' }}>●</span>}
                        {owner.kyc_status ? owner.kyc_status.charAt(0).toUpperCase() + owner.kyc_status.slice(1) : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons" style={{ justifyContent: 'flex-end' }}>
                        <Link to={`/admin/owner/${owner.id}`} className="action-btn view" title="View Details">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </Link>
                        <Link to={`/admin/owner/edit/${owner.id}`} className="action-btn edit" title="Edit">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </Link>
                        <button className="action-btn delete" onClick={() => handleDelete(owner.id)} title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>                      </div>
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

export default OwnerList;
