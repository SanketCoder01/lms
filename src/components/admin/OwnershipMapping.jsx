import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getProjects, unitAPI, ownershipAPI, partyAPI, FILE_BASE_URL } from '../../services/api';
import './OwnershipMapping.css';

const OwnershipMapping = () => {
    const [projects, setProjects] = useState([]);
    const [units, setUnits] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('');
    const [unitOwners, setUnitOwners] = useState([]);
    const [currentOwner, setCurrentOwner] = useState(null);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [documents, setDocuments] = useState([]); // Documents for current owner
    const [refreshDocs, setRefreshDocs] = useState(0);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

    useEffect(() => {
        fetchProjects();
        fetchDocumentTypes();
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

    useEffect(() => {
        if (selectedUnit && currentOwner) {
            fetchDocuments(selectedUnit, currentOwner.party_id);
        } else {
            setDocuments([]);
        }
    }, [selectedUnit, currentOwner, refreshDocs]);

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) { console.error(error); }
    };

    const fetchUnits = async (projectId) => {
        try {
            const res = await unitAPI.getUnitsByProject(projectId);
            setUnits(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) { console.error(error); }
    };

    const fetchOwnerships = async (unitId) => {
        try {
            const res = await ownershipAPI.getOwnersByUnit(unitId);
            const owners = res.data || [];
            setUnitOwners(owners);
            const active = owners.find(o => o.ownership_status === 'Active');
            setCurrentOwner(active || null);
        } catch (error) { console.error("Failed to fetch ownerships", error); }
    };

    const fetchDocumentTypes = async () => {
        try {
            const res = await ownershipAPI.getDocumentTypes();
            setDocumentTypes(res.data || []);
        } catch (error) { console.error("Failed to fetch types", error); }
    };

    const fetchDocuments = async (unitId, partyId) => {
        try {
            const res = await ownershipAPI.getDocuments(unitId, partyId);
            setDocuments(res.data || []);
        } catch (error) { console.error("Failed to fetch docs", error); }
    };

    const handleRemoveOwner = async () => {
        if (!currentOwner) return;
        if (window.confirm('Are you sure you want to remove the current owner?')) {
            try {
                await ownershipAPI.removeOwner({ unit_id: selectedUnit, party_id: currentOwner.party_id, end_date: new Date().toISOString().split('T')[0] });
                fetchOwnerships(selectedUnit);
            } catch (error) { alert('Failed to remove owner'); }
        }
    };

    const handleFileUpload = async (e, typeId) => {
        if (!typeId) {
            alert("Error: Document Type ID is missing. Please refresh or check configuration.");
            return;
        }
        const file = e.target.files[0];
        if (!file || !currentOwner) return;

        // Prompt for date, defaulting to today
        const defaultDate = new Date().toISOString().split('T')[0];
        const date = prompt("Enter Document Date (YYYY-MM-DD)", defaultDate);
        if (!date) return;

        const formData = new FormData();
        formData.append('unit_id', selectedUnit);
        formData.append('party_id', currentOwner.party_id);
        formData.append('document_type_id', typeId);
        formData.append('document_date', date);
        formData.append('document', file);

        try {
            await ownershipAPI.uploadDocument(formData);
            setRefreshDocs(prev => prev + 1);
        } catch (error) {
            alert("Failed to upload: " + (error.response?.data?.message || error.message));
        }
    };

    const viewDocument = (doc) => {
        if (doc?.file_path) {
            // Ensure proper path construction
            const url = `${FILE_BASE_URL}${doc.file_path}`;
            window.open(url, '_blank');
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/admin/dashboard">HOME</Link> &gt; <span className="active">OWNERSHIP MAPPING</span>
                    </div>
                    <h1>Ownership Mapping</h1>
                    <p>Assign Owners to Units and Manage Documents.</p>
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

                                {currentOwner && (
                                    <>
                                        <div style={{ marginTop: '30px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>Ownership Documents</h3>
                                            {/* Removed Manage Types Button */}
                                        </div>

                                        <div className="doc-chain-table" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                            {/* Header Row */}
                                            <div className="doc-header" style={{ display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 0.8fr', background: '#f8fafc', padding: '12px 20px', borderBottom: '1px solid #e2e8f0', fontWeight: '600', color: '#475569', fontSize: '14px' }}>
                                                <div>Document Name</div>
                                                <div style={{ textAlign: 'center' }}>Upload</div>
                                                <div style={{ textAlign: 'center' }}>Date</div>
                                                <div style={{ textAlign: 'center' }}>Action</div>
                                            </div>

                                            {/* Document Rows */}
                                            {['Allotment Letter', 'SBA', 'Purchase Agreement', 'Possession Handover', 'Conveyance Deed', 'Sale Deed'].map((defaultName, index) => {
                                                const type = documentTypes.find(t => t.name === defaultName) || { id: null, name: defaultName };
                                                const doc = documents.find(d => d.document_type_id === type.id);

                                                return (
                                                    <div key={index} className="doc-row" style={{
                                                        display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 0.8fr', alignItems: 'center',
                                                        padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fff'
                                                    }}>
                                                        {/* Document Name + Radio */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <div className={`radio-indicator ${doc ? 'checked' : ''}`} style={{
                                                                width: '18px', height: '18px', borderRadius: '50%',
                                                                border: doc ? '6px solid #16a34a' : '2px solid #cbd5e1',
                                                                boxSizing: 'border-box',
                                                                flexShrink: 0
                                                            }} />
                                                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#334155' }}>
                                                                {defaultName}
                                                            </span>
                                                        </div>

                                                        {/* Upload Column */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            {doc ? (
                                                                <span style={{ color: '#16a34a' }}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                </span>
                                                            ) : (
                                                                type.id ? (
                                                                    <label className="upload-plus-btn" style={{
                                                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                        width: '28px', height: '28px', background: '#3b82f6', color: 'white',
                                                                        borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'
                                                                    }} title="Upload Document">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                        <input type="file" hidden onChange={(e) => handleFileUpload(e, type.id)} />
                                                                    </label>
                                                                ) : (
                                                                    <span style={{ fontSize: '18px', color: '#cbd5e1' }} title="Type not found">•</span>
                                                                )
                                                            )}
                                                        </div>

                                                        {/* Date Column */}
                                                        <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                                                            {doc ? new Date(doc.document_date).toLocaleDateString() : '11/1/26'}
                                                        </div>

                                                        {/* Action Column */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            {doc ? (
                                                                <button className="icon-btn" onClick={() => viewDocument(doc)} title="View Document" style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                                </button>
                                                            ) : (
                                                                <span style={{ color: '#cbd5e1' }}>-</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
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
    const [selectedParty, setSelectedParty] = useState(null);
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

    const handleAssign = async () => {
        if (!selectedParty) return;
        try {
            await ownershipAPI.assignOwner({ unit_id: unitId, party_id: selectedParty.id, start_date: startDate });
            onAssign();
        } catch (e) {
            alert("Failed to assign: " + (e.response?.data?.message || e.message));
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Assign Owner</h3>
                <div className="form-group">
                    <label>Search Party</label>
                    <input
                        className="form-input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Type name..."
                        autoFocus
                    />
                    <div className="search-results">
                        {parties.map(p => (
                            <div
                                key={p.id}
                                className={`search-item ${selectedParty?.id === p.id ? 'selected' : ''}`}
                                onClick={() => setSelectedParty(p)}
                            >
                                {p.company_name || `${p.first_name} ${p.last_name}`} ({p.type})
                            </div>
                        ))}
                    </div>
                </div>
                <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Assignment Date</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-submit" onClick={handleAssign} disabled={!selectedParty}>Assign</button>
                </div>
            </div>
        </div>
    );
};

export default OwnershipMapping;
