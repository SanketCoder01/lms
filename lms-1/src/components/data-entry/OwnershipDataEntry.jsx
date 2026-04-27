import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataEntrySidebar from './DataEntrySidebar';
import { getProjects, unitAPI, ownershipAPI, partyAPI } from '../../services/api';
import '../admin/OwnershipMapping.css'; // Reuse Admin styles

const OwnershipDataEntry = () => {
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [unitOwners, setUnitOwners] = useState([]); // List of history
    const [currentOwner, setCurrentOwner] = useState(null);
    // const [loading, setLoading] = useState(false);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchUnits(selectedProject);
        } else {
            setUnits([]);
            setSelectedUnit('');
        }
    }, [selectedProject]);

    useEffect(() => {
        if (selectedUnit) {
            fetchOwnerships(selectedUnit);
        } else {
            setUnitOwners([]);
            setCurrentOwner(null);
        }
    }, [selectedUnit]);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUnits = async (projectId) => {
        try {
            const res = await unitAPI.getUnitsByProject(projectId, true);
            setUnits(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchOwnerships = async (unitId) => {
        // setLoading(true);
        try {
            const res = await ownershipAPI.getOwnersByUnit(unitId);
            const owners = res.data || [];
            setUnitOwners(owners);
            const active = owners.find(o => o.ownership_status === 'Active');
            setCurrentOwner(active || null);
        } catch (error) {
            console.error("Failed to fetch ownerships", error);
        } finally {
            // setLoading(false);
        }
    };

    const handleRemoveOwner = async () => {
        if (!currentOwner) return;
        if (window.confirm('Are you sure you want to remove the current owner?')) {
            try {
                await ownershipAPI.removeOwner({ unit_id: selectedUnit, party_id: currentOwner.party_id, end_date: new Date().toISOString().split('T')[0] });
                fetchOwnerships(selectedUnit);
            } catch (error) {
                alert('Failed to remove owner');
            }
        }
    };

    return (
        <div className="dashboard-container">
            <DataEntrySidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/data-entry/dashboard">HOME</Link> &gt; <span className="active">OWNERSHIP DATA</span>
                    </div>
                    <h1>Ownership Data Entry</h1>
                    <p>Assign Owners to Units and manage ownership records.</p>
                </header>

                <div className="mapping-interface">
                    <div className="selection-panel">
                        <div className="selection-group">
                            <label>Select Project</label>
                            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                                <option value="">-- Choose Project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="selection-group">
                            <label>Select Unit</label>
                            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} disabled={!selectedProject}>
                                <option value="">-- Choose Unit --</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>Unit {u.unit_number} ({u.status})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="details-panel">
                        {!selectedUnit ? (
                            <div className="no-unit-selected">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                <p>Select a Unit to view ownership details</p>
                            </div>
                        ) : (
                            <>
                                <h3>Current Ownership</h3>
                                {currentOwner ? (
                                    <div className="current-owner-card">
                                        <div className="owner-info">
                                            <h4>{currentOwner.company_name || `${currentOwner.first_name} ${currentOwner.last_name}`}</h4>
                                            <p>Since: {new Date(currentOwner.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <button className="remove-btn" onClick={handleRemoveOwner}>Remove</button>
                                    </div>
                                ) : (
                                    <div className="current-owner-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                        <div className="owner-info">
                                            <h4 style={{ color: '#64748b' }}>No Active Owner</h4>
                                        </div>
                                        <button className="assign-btn" onClick={() => setIsAssignModalOpen(true)}>Assign New Owner</button>
                                    </div>
                                )}

                                <h3>Ownership History</h3>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Owner Name</th>
                                            <th>Status</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitOwners.map(o => (
                                            <tr key={o.id}>
                                                <td>{o.company_name || `${o.first_name} ${o.last_name}`}</td>
                                                <td>
                                                    <span className={`status-badge ${o.ownership_status.toLowerCase() === 'active' ? 'individual' : 'company'}`} style={{ background: o.ownership_status === 'Active' ? '#dcfce7' : '#f1f5f9', color: o.ownership_status === 'Active' ? '#166534' : '#64748b' }}>
                                                        {o.ownership_status}
                                                    </span>
                                                </td>
                                                <td>{new Date(o.start_date).toLocaleDateString()}</td>
                                                <td>{o.end_date ? new Date(o.end_date).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                        {unitOwners.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No history found</td></tr>}
                                    </tbody>
                                </table>
                            </>
                        )}
                    </div>
                </div>

                {isAssignModalOpen && (
                    <AssignOwnerModal
                        isOpen={isAssignModalOpen}
                        onClose={() => setIsAssignModalOpen(false)}
                        unitId={selectedUnit}
                        onAssign={() => {
                            setIsAssignModalOpen(false);
                            fetchOwnerships(selectedUnit);
                        }}
                    />
                )}
            </main>
        </div>
    );
};

const AssignOwnerModal = ({ isOpen, onClose, unitId, onAssign }) => {
    const [search, setSearch] = useState('');
    const [parties, setParties] = useState([]);
    const [selectedOwners, setSelectedOwners] = useState([]); // Array of { party, share }
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        const searchParties = async () => {
            try {
                const res = await partyAPI.getAllParties({ search });
                setParties(res.data || []);
            } catch (e) { console.error(e); }
        };
        searchParties();
    }, [search]);

    const handleAddOwner = (party) => {
        if (selectedOwners.length >= 4) {
            alert('Maximum 4 joint owners allowed.');
            return;
        }
        if (selectedOwners.some(o => o.party.id === party.id)) {
            alert('Owner already added.');
            return;
        }
        
        let initialShare = 100;
        if (selectedOwners.length === 1) initialShare = 50;
        else if (selectedOwners.length > 0) initialShare = 0;
        
        // Auto-balance existing slightly if just 2
        let newOwners = [...selectedOwners];
        if (newOwners.length === 1 && newOwners[0].share === 100) {
            newOwners[0].share = 50;
        }

        setSelectedOwners([...newOwners, { party, share: initialShare }]);
        setSearch(''); // clear search
    };

    const handleRemoveOwner = (id) => {
        setSelectedOwners(selectedOwners.filter(o => o.party.id !== id));
    };

    const handleShareChange = (id, newShare) => {
        const value = Math.max(0, Math.min(100, Number(newShare)));
        setSelectedOwners(selectedOwners.map(o => o.party.id === id ? { ...o, share: value } : o));
    };

    const handleAssign = async () => {
        if (selectedOwners.length === 0) return;
        
        const totalShare = selectedOwners.reduce((sum, o) => sum + Number(o.share || 0), 0);
        if (Math.abs(totalShare - 100) > 0.01) {
            alert(`Total share percentage is ${totalShare}%. It must be exactly 100%.`);
            return;
        }

        try {
            await ownershipAPI.assignOwner({ 
                unit_id: unitId, 
                start_date: startDate,
                owners: selectedOwners.map(o => ({ party_id: o.party.id, share_percentage: o.share }))
            });
            onAssign();
        } catch (e) {
            alert("Failed to assign: " + (e.response?.data?.message || e.message));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
                <h3>Assign Owner(s)</h3>
                
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>
                        Selected Joint Owners ({selectedOwners.length}/4)
                    </p>
                    
                    {selectedOwners.map(owner => (
                        <div key={owner.party.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', background: '#f8fafc', padding: '10px', borderRadius: '4px' }}>
                            <div style={{ flex: 1 }}>
                                <strong>{owner.party.company_name || `${owner.party.first_name} ${owner.party.last_name}`}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <input 
                                    type="number" 
                                    value={owner.share} 
                                    onChange={(e) => handleShareChange(owner.party.id, e.target.value)}
                                    style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                    min="0" max="100" step="0.01"
                                /> %
                            </div>
                            <button onClick={() => handleRemoveOwner(owner.party.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                        </div>
                    ))}
                    {selectedOwners.length === 0 && (
                        <div style={{ padding: '10px', background: '#f8fafc', color: '#94a3b8', textAlign: 'center', borderRadius: '4px' }}>
                            Search and select below to add owners...
                        </div>
                    )}
                </div>

                {selectedOwners.length < 4 && (
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Search Party to Add</label>
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type company or name..."
                        />
                        {search && parties.length > 0 && (
                            <div className="search-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #cbd5e1', maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                {parties.map(p => (
                                    <div
                                        key={p.id}
                                        className="search-item"
                                        onClick={() => handleAddOwner(p)}
                                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                                        onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.target.style.background = 'transparent'}
                                    >
                                        {p.company_name || `${p.first_name} ${p.last_name}`} ({p.type})
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Assignment Date</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                
                <div className="form-actions" style={{ marginTop: '20px' }}>
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-submit" onClick={handleAssign} disabled={selectedOwners.length === 0}>Assign Owner(s)</button>
                </div>
            </div>
        </div>
    );
};

export default OwnershipDataEntry;
