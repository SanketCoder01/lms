import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { partyAPI } from '../../services/api';
import ReportGenerator from './ReportGenerator';
import usePermissions from '../../hooks/usePermissions';
import './PartyMaster.css';

const PartyMaster = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [showReportModal, setShowReportModal] = useState(false);
    const { can } = usePermissions();

    // Report columns for Parties - All sections
    const partyReportColumns = [
        // Basic Info
        { key: 'id', label: 'Party ID' },
        { key: 'type', label: 'Structure Type' },
        { key: 'party_type', label: 'Party Role' },
        // Company/Individual Details
        { key: 'company_name', label: 'Company Name' },
        { key: 'brand_name', label: 'Brand Name' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'pan_number', label: 'PAN Number' },
        { key: 'gst_number', label: 'GST Number' },
        { key: 'cin_number', label: 'CIN Number' },
        // Contact Info
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'alt_phone', label: 'Alternate Phone' },
        // Address
        { key: 'address_line1', label: 'Address Line 1' },
        { key: 'address_line2', label: 'Address Line 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'postal_code', label: 'Postal Code' },
        { key: 'country', label: 'Country' },
        // Identification
        { key: 'identification_type', label: 'ID Type' },
        { key: 'identification_number', label: 'ID Number' },
        // Business Details
        { key: 'brand_category', label: 'Brand Category' },
        { key: 'owner_group', label: 'Owner Group' },
        { key: 'representative_designation', label: 'Representative Designation' },
        // Bank Details
        { key: 'bank_name', label: 'Bank Name' },
        { key: 'account_number', label: 'Account Number' },
        { key: 'ifsc_code', label: 'IFSC Code' },
        { key: 'branch_name', label: 'Branch Name' },
        // Additional
        { key: 'remarks', label: 'Remarks' },
        { key: 'created_at', label: 'Created Date' },
        { key: 'updated_at', label: 'Updated Date' }
    ];

    useEffect(() => {
        fetchParties();
    }, []);

    const handleExportCSV = () => {
        if (parties.length === 0) return;
        const headers = ["Name/Company Name", "Brand Name/Nickname", "Structure Type", "Party Role", "Phone", "Email", "State", "City"];
        const rows = filteredParties.map(p => [
            p.type === 'Company' ? p.company_name : `${p.first_name} ${p.last_name}`,
            p.brand_name || 'N/A',
            p.type,
            p.party_type,
            p.phone,
            p.email,
            p.state || 'N/A',
            p.city || 'N/A'
        ]);
        
        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "parties_master.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const fetchParties = async () => {
        try {
            setLoading(true);
            const res = await partyAPI.getAllParties();
            setParties(res.data || []);
        } catch (error) {
            console.error("Failed to fetch parties", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredParties = parties.filter(party => {
        const matchesSearch = (
            (party.company_name?.toLowerCase().includes(search.toLowerCase())) ||
            (party.first_name?.toLowerCase().includes(search.toLowerCase())) ||
            (party.last_name?.toLowerCase().includes(search.toLowerCase())) ||
            (party.email?.toLowerCase().includes(search.toLowerCase())) ||
            (party.phone?.includes(search))
        );
        const matchesType = filterType === 'All' || party.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard">HOME</Link> &gt; <span className="active">MASTERS</span>
                        </div>
                        <h1>Masters</h1>
                        <p>Manage all individuals and companies (Owners & Tenants).</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleExportCSV} className="secondary-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export CSV
                        </button>
                        <button onClick={() => setShowReportModal(true)} className="secondary-btn" style={{ background: '#eff6ff', color: '#2e66ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                            </svg>
                            Generate Report
                        </button>
                        {can('edit', 'masters') ? (
                            <Link to="/admin/parties/add" className="primary-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add Party
                            </Link>
                        ) : (
                            <button disabled className="primary-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }} title="No edit permission">
                                🔒 Add Party
                            </button>
                        )}
                    </div>
                </header>

                <div className="content-card">
                    {/* Filters */}
                    <div className="filters-bar" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="search-wrapper" style={{ flex: 1 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search by name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', minWidth: '120px' }}
                        >
                            <option value="All">All</option>
                            <option value="Individual">Individual</option>
                            <option value="Company">Company</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name / Company</th>
                                    <th>Structure Type</th>
                                    <th>Contact Info</th>
                                    <th>Tenant or Owner</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan="5" className="empty-state">Loading parties...</td></tr>
                                )}
                                {!loading && filteredParties.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="empty-state">
                                            No parties found.
                                        </td>
                                    </tr>
                                )}
                                {!loading && filteredParties.map((party) => (
                                    <tr key={party.id}>
                                        <td>
                                            <div className="party-info">
                                                <div className="party-avatar">
                                                    {(party.company_name ? party.company_name.charAt(0) : party.first_name.charAt(0)).toUpperCase()}
                                                </div>
                                                <div className="party-details">
                                                    <div className="party-name">
                                                        {party.type === 'Company' ? party.company_name : `${party.first_name} ${party.last_name}`}
                                                    </div>
                                                    {party.type === 'Company' && party.brand_name && (
                                                        <div className="sub-text">Brand: {party.brand_name}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${party.type.toLowerCase()}`}>
                                                {party.type}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="contact-info">
                                                <div className="contact-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                                    {party.phone}
                                                </div>
                                                <div className="contact-item">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                                    {party.email}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${party.party_type ? party.party_type.toLowerCase() : 'neutral'}`}>
                                                {party.party_type || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-icon-wrapper right">
                                                <Link to={`/admin/parties/view/${party.id}`} className="action-icon-btn view" title="View Details">
                                                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </Link>
                                                {can('edit', 'masters') ? (
                                                    <Link to={`/admin/parties/edit/${party.id}`} className="action-icon-btn edit" title="Edit">
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </Link>
                                                ) : (
                                                    <button disabled className="action-icon-btn" title="No edit permission" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    </button>
                                                )}
                                                {can('delete', 'masters') ? (
                                                    <button className="action-icon-btn delete" onClick={() => {
                                                        if (window.confirm('Are you sure you want to delete this party?')) {
                                                            partyAPI.deleteParty(party.id).then(() => fetchParties()).catch(e => alert('Failed to delete party.'));
                                                        }
                                                    }} title="Delete">
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                    </button>
                                                ) : (
                                                    <button disabled className="action-icon-btn" title="No delete permission" style={{ opacity: 0.4, cursor: 'not-allowed' }}>
                                                        <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showReportModal && (
                <ReportGenerator
                    title="Parties Report"
                    data={parties}
                    columns={partyReportColumns}
                    onClose={() => setShowReportModal(false)}
                />
            )}
        </div>
    );
};

export default PartyMaster;
