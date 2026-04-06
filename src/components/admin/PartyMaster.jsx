import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { partyAPI } from '../../services/api';
import './PartyMaster.css';

const PartyMaster = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');

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
                        <Link to="/admin/parties/add" className="primary-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add Party
                        </Link>
                    </div>
                </header>

                <div className="content-card">
                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="search-wrapper">
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
                            className="filter-select"
                        >
                            <option value="All">All Types</option>
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
                                                <Link to={`/admin/parties/edit/${party.id}`} className="action-icon-btn view" title="View Details">
                                                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                </Link>
                                                <Link to={`/admin/parties/edit/${party.id}`} className="action-icon-btn edit" title="Edit">
                                                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                </Link>
                                                <button className="action-icon-btn delete" onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this party?')) {
                                                        partyAPI.deleteParty(party.id).then(() => fetchParties()).catch(e => alert('Failed to delete party.'));
                                                    }
                                                }} title="Delete">
                                                    <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
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

export default PartyMaster;
