import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { unitAPI, getProjects } from '../../services/api';
import './units.css';

const Units = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialProjectId = queryParams.get('projectId');

    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBuilding, setSelectedBuilding] = useState(initialProjectId || 'All');
    const [selectedUnitType, setSelectedUnitType] = useState('All'); // Acts as Status Filter
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);

    /* ================= FETCH PROJECTS FOR DROPDOWN ================= */
    useEffect(() => {
        const fetchProjectsList = async () => {
            try {
                const response = await getProjects();
                // Ensure we handle the response structure correctly
                const projData = response.data.data || response.data;
                setProjects(projData);
            } catch (err) {
                console.error("Error fetching projects:", err);
            }
        };
        fetchProjectsList();
    }, []);

    /* ================= FETCH UNITS ================= */
    useEffect(() => {
        const fetchUnits = async () => {
            try {
                setLoading(true);


                const params = {};
                if (searchTerm) params.search = searchTerm;
                if (selectedBuilding !== 'All') params.projectId = selectedBuilding;
                if (selectedUnitType !== 'All') params.status = selectedUnitType; // Mapping Unit Type to Status filter

                const response = await unitAPI.getUnits(params);
                const data = response.data.data || response.data; // Handle wrapped/unwrapped


                if (!Array.isArray(data)) {
                    throw new Error('API response is not an array');
                }

                const mappedUnits = data.map(unit => ({
                    id: unit.id,
                    unitNo: unit.unit_number || 'N/A',
                    building: unit.building || 'N/A',
                    blockTower: unit.block_tower || '-',
                    area: unit.super_area || 'N/A',
                    status: unit.status || 'unknown',
                    statusType: unit.status || 'unknown',
                    statusDesc: unit.status === 'vacant' ? 'Available for leasing' : 'Occupied'
                }));
                setUnits(mappedUnits);
                setError(null);
            } catch (err) {
                console.error('Fetch error:', err);
                setError(err.message || 'Failed to fetch units');
                setUnits([]);
            } finally {
                setLoading(false);
            }
        };

        // Debounce search
        const timer = setTimeout(() => {
            fetchUnits();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, selectedBuilding, selectedUnitType]);

    // Handlers
    const handleSearchChange = (e) => setSearchTerm(e.target.value);
    const handleBuildingChange = (e) => setSelectedBuilding(e.target.value);
    const handleUnitTypeChange = (e) => setSelectedUnitType(e.target.value);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedBuilding('All');
        setSelectedUnitType('All');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this unit?')) {
            try {
                await unitAPI.deleteUnit(id);
                setUnits(units.filter(unit => unit.id !== id));
            } catch (err) {
                console.error('Error deleting unit:', err);
                alert('Failed to delete unit');
            }
        }
    };

    if (loading && units.length === 0) { // Only show full loading screen if no data
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <p>Loading units...</p>
                </main>
            </div>
        );
    }

    if (error && units.length === 0) {
        return (
            <div className="dashboard-container">
                <Sidebar />
                <main className="main-content">
                    <p>Error fetching units: {error}</p>
                    <button onClick={() => window.location.reload()}>Retry</button>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-left">
                        <div className="breadcrumb">
                            <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/projects">PROJECTS</Link> &gt; <span className="active">UNITS INVENTORY</span>
                        </div>
                        <h1>Unit Management</h1>
                        <p>Manage your property inventory, availability, and unit details.</p>
                    </div>
                    <Link to="/admin/add-unit" className="primary-btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>+ Add Units</Link>
                </header>

                <div className="content-card">
                    {/* Filters Bar */}
                    <div className="filters-bar">
                        <div className="search-wrapper">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input type="text" placeholder="Search by Unit No, Tenant, or Building..." value={searchTerm} onChange={handleSearchChange} />
                        </div>
                        <div className="filter-group">
                            <div className="dropdown-filter">
                                <select value={selectedBuilding} onChange={handleBuildingChange}>
                                    <option value="All">All Projects</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name}</option>
                                    ))}
                                </select>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                            <div className="dropdown-filter">
                                <select value={selectedUnitType} onChange={handleUnitTypeChange}>
                                    <option value="All">All Status</option>
                                    <option value="vacant">Vacant</option>
                                    <option value="occupied">Occupied</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </div>
                        </div>
                        <div className="view-actions">
                            {/* Icons removed as per request */}
                            <button className="text-btn" onClick={handleClearFilters}>Clear filters</button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Unit No</th>
                                    <th>Building/Project</th>
                                    <th>Block/Tower</th>
                                    <th>Area (SQ FT)</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {units.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>No units found.</td>
                                    </tr>
                                ) : (
                                    units.map((unit) => (
                                        <tr key={unit.id}>
                                            <td className="unit-id">{unit.unitNo}</td>
                                            <td>{unit.building}</td>
                                            <td>{unit.blockTower}</td>
                                            <td>{unit.area}</td>
                                            <td><span className={`status-badge ${unit.status}`}>{unit.status}</span></td>
                                            <td>
                                                <div className="action-buttons">
                                                    <Link to={`/admin/view-unit/${unit.id}`} className="action-btn view" title="View">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </Link>
                                                    <Link to={`/admin/edit-unit/${unit.id}`} className="action-btn edit" title="Edit">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                    </Link>
                                                    <button className="action-btn delete" onClick={() => handleDelete(unit.id)} title="Delete">
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

                    <div className="pagination">
                        <span>Rows per page: 10 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>
                        <span>1—{units.length} of {units.length}</span>
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

export default Units;