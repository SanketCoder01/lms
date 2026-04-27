import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { tenantAPI } from '../../services/api';
import './Tenant.css';

const Tenant = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getTenants();
      const data = response.data?.tenants || response.data || [];
      setTenants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      setError("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this tenant?")) {
      try {
        await tenantAPI.deleteTenant(id);
        setTenants(tenants.filter(t => t.id !== id));
      } catch (err) {
        alert("Failed to delete tenant");
      }
    }
  };

  const filteredTenants = tenants.filter(tenant =>
    tenant.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_person_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.contact_person_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <header className="page-header">
          <div className="header-left">
            <div className="breadcrumb">HOME &gt; TENANT LIST</div>
            <h1>Tenant Management</h1>
            <p>Manage corporate tenants, subtenants, and contact details.</p>
          </div>
          <button className="primary-btn" onClick={() => navigate('/admin/add-tenant')}>
            + Add Tenant
          </button>
        </header>

        <div className="content-card">
          <div className="filters-bar">
            <div className="search-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                placeholder="Search by Company, Contact Name or Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="view-actions">
              <button className="text-btn" onClick={() => setSearchTerm('')}>Clear filters</button>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Industry</th>
                  <th>Contact Person</th>
                  <th>Email / Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                ) : error ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'red' }}>{error}</td></tr>
                ) : filteredTenants.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No tenants found.</td></tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id}>
                      <td>
                        <div className="tenant-company">
                          <div className="avatar-placeholder" style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            backgroundColor: '#e0e7ff', color: '#4338ca', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '10px'
                          }}>
                            {tenant.company_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{tenant.company_name}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>Reg: {tenant.company_registration_number || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{tenant.industry || 'N/A'}</td>
                      <td>{tenant.contact_person_name}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                          <span>{tenant.contact_person_email}</span>
                          <span style={{ color: '#666' }}>{tenant.contact_person_phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-btn view" title="View" onClick={() => navigate(`/admin/tenant/${tenant.id}`)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          </button>
                          <button className="action-btn edit" title="Edit" onClick={() => navigate(`/admin/tenant/edit/${tenant.id}`)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                          </button>
                          <button className="action-btn delete" title="Delete" onClick={() => handleDelete(tenant.id)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tenant;
