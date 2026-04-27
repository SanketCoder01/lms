import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { partyAPI } from '../../services/api';
import '../admin/PartyMaster.css'; // Reuse Admin styles

const MasterDataEntry = () => {
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        fetchParties();
    }, []);

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
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/data-entry/dashboard">HOME</Link> &gt; <span className="active">MASTER DATA</span>
                        </div>
                        <h1>Master Data Entry</h1>
                        <p>Manage all individuals and companies (Owners & Tenants).</p>
                    </div>
                    <Link to="/data-entry/add-master-data/add" className="primary-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Add Party
                    </Link>
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
                                    <th>Type</th>
                                    <th>Contact Info</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan="4" className="empty-state">Loading parties...</td></tr>
                                )}
                                {!loading && filteredParties.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="empty-state">
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
                                                    {party.type === 'Company' && (
                                                        <div className="sub-text">Contact: {party.first_name} {party.last_name}</div>
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
                                        <td>{party.city || party.address_line1 || 'N/A'}</td>
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

export default MasterDataEntry;
