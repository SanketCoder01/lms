import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { unitAPI, ownershipAPI, leaseAPI } from '../../services/api';
import './UnitDetails.css';

const UnitDetails = () => {
    const { id } = useParams();
    const [unit, setUnit] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null);

    const [activeOwner, setActiveOwner] = useState(null);
    const [activeLease, setActiveLease] = useState(null);

    useEffect(() => {
        const fetchUnit = async () => {
            try {
                const res = await unitAPI.getUnitById(id);
                setUnit(res.data.data || res.data);

                // Fetch Owner
                const ownerRes = await ownershipAPI.getOwnersByUnit(id);
                const owners = ownerRes.data || [];
                const active = owners.find(o => o.ownership_status === 'Active');
                setActiveOwner(active);

                // Fetch Active Lease - only if unit is not vacant
                const unitStatus = (res.data.data || res.data).status || '';
                const isVacant = unitStatus.toLowerCase() === 'vacant' || unitStatus.toLowerCase() === 'available';
                
                if (!isVacant) {
                    // Try multiple status values and also fetch by unit_id
                    let activeLeaseData = null;
                    
                    // First try: get leases for this unit with active status
                    for (const status of ['active', 'Active', 'leased', 'occupied', 'approved', 'Leased']) {
                        const leaseRes = await leaseAPI.getAllLeases({ unit_id: id, status: status, limit: 1 });
                        const leases = leaseRes.data || [];
                        if (leases && leases.length > 0) {
                            activeLeaseData = leases[0];
                            break;
                        }
                    }
                    
                    // Second try: get all leases for this unit and find the most recent active one
                    if (!activeLeaseData) {
                        const allLeasesRes = await leaseAPI.getAllLeases({ unit_id: id, limit: 10 });
                        const allLeases = allLeasesRes.data || [];
                        // Find the most recent active lease
                        activeLeaseData = allLeases.find(l => {
                            const s = (l.status || '').toLowerCase();
                            return s === 'active' || s === 'approved' || s === 'occupied' || s === 'leased';
                        }) || allLeases[0]; // Fallback to most recent lease if no active found
                    }
                    
                    if (activeLeaseData) {
                        setActiveLease(activeLeaseData);
                    }
                }
            } catch (err) {
                console.error("Error fetching unit:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUnit();
    }, [id]);

    if (loading) return <div className="dashboard-container">Loading...</div>;
    if (!unit) return <div className="dashboard-container">Unit not found</div>;

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="unit-details-container">

                    {/* Header */}
                    <header className="details-header">
                        <div className="header-left">
                            <div className="breadcrumb">
                                <Link to="/admin/projects">PROJECT</Link> &gt;
                                <span>{unit.project_name}</span> &gt;
                                <span className="active">UNIT {unit.unit_number}</span>
                            </div>

                            <div className="title-row">
                                <h1>Unit {unit.unit_number} – {unit.project_name}</h1>
                                <span className={`status-badge ${unit.status}`}>
                                    {unit.status}
                                </span>
                            </div>

                            <p className="subtitle">
                                Project: {unit.project_name}
                                &nbsp;&nbsp; Unit No: {unit.unit_number}
                                &nbsp;&nbsp; Owner: {activeOwner ? (activeOwner.company_name || `${activeOwner.first_name} ${activeOwner.last_name}`) : 'Unassigned'}
                            </p>
                        </div>

                        <Link to={`/admin/edit-unit/${unit.id}`} className="edit-unit-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                            Edit Unit
                        </Link>
                    </header>

                    {/* Content Grid */}
                    <div className="details-content">

                        {/* Profiles Row (UNCHANGED UI) */}
                        <div className="profiles-row">

                            {/* Tenant - Only show lease info if unit is not vacant */}
                            <div className="profile-card tenant">
                                <div className="card-header">
                                    <div className="user-info">
                                        <div className="avatar tenant-avatar">
                                            {activeLease ? (
                                                <div style={{ width: '100%', height: '100%', background: '#4F46E5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {(activeLease.brand_name || activeLease.tenant_name || activeLease.tenant?.company_name || 'T').charAt(0)}
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }}></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3>{activeLease ? (activeLease.brand_name || activeLease.tenant_name || activeLease.tenant?.company_name || activeLease.tenant?.brand_name || 'Active Tenant') : (unit.status?.toLowerCase() === 'vacant' ? 'Vacant' : 'No Active Tenant')}</h3>
                                            <span className="since">{activeLease ? `Since ${new Date(activeLease.lease_start).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : (unit.status?.toLowerCase() === 'vacant' ? 'Available for lease' : 'No lease data')}</span>
                                        </div>
                                    </div>
                                    {activeLease && <span className="badge active-lease">Active Lease</span>}
                                </div>
                                <div className="card-footer">
                                    {activeLease ? (
                                        <>
                                            <span>Lease #: L-{activeLease.id}</span>
                                            <Link to={`/admin/view-lease/${activeLease.id}`} className="details-link">Details →</Link>
                                        </>
                                    ) : (
                                        <Link to="/admin/add-lease" className="details-link">Create Lease →</Link>
                                    )}
                                </div>
                            </div>

                            {/* Owner */}
                            <div className="profile-card owner">
                                <div className="card-header">
                                    <div className="user-info">
                                        <div className="avatar">
                                            {activeOwner ? (
                                                <div style={{ width: '100%', height: '100%', background: '#0D8ABC', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                                    {(activeOwner.company_name || activeOwner.first_name).charAt(0)}
                                                </div>
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#e2e8f0' }}></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3>
                                                {activeOwner
                                                    ? (activeOwner.company_name || `${activeOwner.first_name} ${activeOwner.last_name}`)
                                                    : 'No Active Owner'}
                                            </h3>
                                            <span className="since">{activeOwner ? `Since ${new Date(activeOwner.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}` : 'Unassigned'}</span>
                                        </div>
                                    </div>
                                    {activeOwner && <span className="badge leased">Active</span>}
                                </div>
                                <div className="card-footer">
                                    {activeOwner ? (
                                        <Link to={`/admin/parties/edit/${activeOwner.party_id}`} className="details-link">View Party →</Link>
                                    ) : (
                                        <Link to="/admin/ownership-mapping" className="details-link">Assign Owner →</Link>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Gallery Section (UNCHANGED) */}
                        <div className="gallery-section">
                            <div className="gallery-grid">
                                <div className="gallery-item main">
                                    <div className="image-placeholder main-placeholder">
                                        {unit.unit_image ? (
                                            <img
                                                src={unit.unit_image.startsWith('http') ? unit.unit_image : `/uploads/${unit.unit_image}`}
                                                alt={`Unit ${unit.unit_number}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80';
                                                }}
                                            />
                                        ) : (
                                            <svg width="40" height="40" viewBox="0 0 24 24"
                                                fill="none" stroke="#cbd5e1" strokeWidth="2"
                                                strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <polyline points="21 15 16 10 5 21" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <div className="gallery-side">
                                    <div className="gallery-item">
                                        <div className="image-placeholder"></div>
                                    </div>
                                    <div className="gallery-item">
                                        <div className="image-placeholder">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar (FROM DB) */}
                        <div className="stats-bar">
                            <div className="stat-item">
                                <label>Area:</label>
                                <div className="stat-values">
                                    <span>Chargeable Area: {unit.chargeable_area ?? "-"} sq ft</span>
                                    <span>Covered Area: {unit.covered_area ?? "-"} sq ft</span>
                                    <span>Carpet Area: {unit.carpet_area ?? "-"} sq ft</span>
                                </div>
                            </div>

                            <div className="stat-item">
                                <label>Fitment Status:</label>
                                <div className="stat-value big">
                                    {unit.unit_condition}
                                </div>
                            </div>

                            <div className="stat-item">
                                <label>Market Rent:</label>
                                <div className="stat-value big">
                                    ₹{unit.projected_rent ?? 0} / month
                                </div>
                            </div>

                            <div className="stat-item">
                                <label>Next Renewal:</label>
                                <div className="stat-values red-text">
                                    {unit.status?.toLowerCase() === 'vacant' ? (
                                        <span>Unit is vacant</span>
                                    ) : activeLease && activeLease.lease_end ? (
                                        <>
                                            <span>Lease Expiry: {new Date(activeLease.lease_end).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                            <span>{Math.ceil((new Date(activeLease.lease_end) - new Date()) / (1000 * 60 * 60 * 24))} days remaining</span>
                                        </>
                                    ) : (
                                        <span>No active lease</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity - Only show lease history for non-vacant units */}
                        <div className="activity-section">
                            <h3>Recent Activity</h3>
                            {unit.status?.toLowerCase() === 'vacant' ? (
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <div className="timeline-dot gray"></div>
                                        <div className="timeline-content">
                                            <h4>Unit Available</h4>
                                            <p>This unit is currently vacant and available for leasing.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : activeLease ? (
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <div className="timeline-dot green"></div>
                                        <div className="timeline-content">
                                            <h4>Lease Created</h4>
                                            <p>Lease #{activeLease.id} started on {new Date(activeLease.lease_start).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                                            <span className="time">{activeLease.brand_name || activeLease.tenant_name || 'Tenant'}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="timeline">
                                    <div className="timeline-item">
                                        <div className="timeline-dot gray"></div>
                                        <div className="timeline-content">
                                            <h4>No Lease History</h4>
                                            <p>No active lease found for this unit.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};

export default UnitDetails;
