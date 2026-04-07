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
    const [activeOwners, setActiveOwners] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [documents, setDocuments] = useState([]); // Documents for current owner
    const [refreshDocs, setRefreshDocs] = useState(0);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    
    // Search state
    const [globalSearch, setGlobalSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProject]);

    useEffect(() => {
        if (selectedUnit) {
            fetchOwnerships(selectedUnit);
        } else {
            setUnitOwners([]);
            setActiveOwners([]);
        }
    }, [selectedUnit]);

    useEffect(() => {
        if (selectedUnit && activeOwners.length > 0) {
            // Using the lead owner (first one) to store documents, as they are shared per assignment
            fetchDocuments(selectedUnit, activeOwners[0].party_id);
        } else {
            setDocuments([]);
        }
    }, [selectedUnit, activeOwners, refreshDocs]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (globalSearch) {
                performGlobalSearch();
            } else {
                setSearchResults([]);
            }
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalSearch]);

    const performGlobalSearch = async () => {
        try {
            setIsSearching(true);
            const res = await ownershipAPI.getAllOwnerships({ search: globalSearch });
            setSearchResults(res.data || []);
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectSearchResult = (result) => {
        const projectId = result.units?.projects?.id || result.units?.project_id || (projects.find(p => p.project_name === result.units?.projects?.project_name)?.id);
        const unitId = result.unit_id;
        if (projectId) setSelectedProject(projectId);
        setTimeout(() => {
            setSelectedUnit(unitId);
        }, 100);
        setGlobalSearch('');
        setSearchResults([]);
    };

    const fetchProjects = async () => {
        try {
            const res = await getProjects();
            setProjects(Array.isArray(res.data) ? res.data : (res.data?.data || []));
        } catch (error) { console.error(error); }
    };

    const fetchUnits = async (projectId) => {
        try {
            // Fetch units for project, send excludeSold=true to filter units already fully assigned / sold
            const res = await unitAPI.getUnitsByProject(projectId, true);
            const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
            // Front-end final filter: only keep units that aren't fully assigned or if they are the currently selected one
            const filteredUnits = data.filter(u => !u.is_full || (selectedUnit && Number(u.id) === Number(selectedUnit)));
            setUnits(filteredUnits);
        } catch (error) { console.error(error); }
    };

    const fetchOwnerships = async (unitId) => {
        try {
            const res = await ownershipAPI.getOwnersByUnit(unitId);
            const owners = res.data || [];
            setUnitOwners(owners);
            const active = owners.filter(o => o.ownership_status === 'Active');
            setActiveOwners(active);
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

    const handleRemoveOwner = async (owner) => {
        if (window.confirm(`Are you sure you want to remove ${owner.company_name || owner.first_name}?`)) {
            try {
                await ownershipAPI.removeOwner({ unit_id: selectedUnit, party_id: owner.party_id, end_date: new Date().toISOString().split('T')[0] });
                fetchOwnerships(selectedUnit);
                fetchUnits(selectedProject); // refresh unit list in case it's now available
            } catch (error) { alert('Failed to remove owner'); }
        }
    };

    const handleFileUpload = async (e, typeId) => {
        if (!typeId) {
            alert("Error: Document Type ID is missing. Please refresh or check configuration.");
            return;
        }
        const file = e.target.files[0];
        if (!file || activeOwners.length === 0) return;

        // Prompt for date, defaulting to today
        const defaultDate = new Date().toISOString().split('T')[0];
        const date = prompt("Enter Document Date (YYYY-MM-DD)", defaultDate);
        if (!date) return;

        const formData = new FormData();
        formData.append('unit_id', selectedUnit);
        formData.append('party_id', activeOwners[0].party_id);
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
            const url = doc.file_path.startsWith('http') 
                ? doc.file_path 
                : `${FILE_BASE_URL.replace('/api', '')}${doc.file_path.startsWith('/') ? '' : '/'}${doc.file_path}`;
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
                
                <div className="header-actions" style={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
                        <div className="search-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', color: '#64748b' }}>
                                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input
                                type="text"
                                placeholder="Search unit, name, company..."
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px 10px 36px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',

                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    background: '#f8fafc'
                                }}
                            />
                        </div>
                        {globalSearch && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #cbd5e1', borderRadius: '4px', maxHeight: '300px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                {isSearching ? <div style={{ padding: '10px', color: '#64748b' }}>Searching...</div> : (
                                    searchResults.length > 0 ? searchResults.map(r => (
                                        <div key={r.id} onClick={() => handleSelectSearchResult(r)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#transparent'}>
                                            <div style={{ fontWeight: 600 }}>{r.parties?.company_name || `${r.parties?.first_name} ${r.parties?.last_name}`}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Unit: {r.units?.unit_number} | {r.units?.projects?.project_name}</div>
                                        </div>
                                    )) : <div style={{ padding: '10px', color: '#64748b' }}>No existing active ownerships found.</div>
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={() => {
                        if (unitOwners.length === 0) {
                            alert("No ownership history to export for this unit.");
                            return;
                        }
                        const headers = ["Unit Number", "Owner Name", "Share %", "Status", "Start Date", "End Date"];
                        const currentUnitNum = units.find(u => u.id === parseInt(selectedUnit))?.unit_number || 'N/A';
                        const rows = unitOwners.map(o => [
                            currentUnitNum,
                            o.company_name || `${o.first_name} ${o.last_name}`,
                            o.share_percentage || 100,
                            o.ownership_status,
                            new Date(o.start_date).toLocaleDateString(),
                            o.end_date ? new Date(o.end_date).toLocaleDateString() : '-'
                        ]);
                        let csvContent = "data:text/csv;charset=utf-8," 
                            + headers.join(",") + "\n"
                            + rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `ownership_unit_${currentUnitNum}.csv`);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }} className="secondary-btn" style={{ background: '#f8f9fa', color: '#333', border: '1px solid #ddd', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} disabled={!selectedUnit}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Export Unit History CSV
                    </button>
                </div>

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
                                    <option key={u.id} value={u.id}>
                                        Unit {u.unit_number} (Available {100 - (u.total_share || 0)}%)
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="details-panel">
                        {!selectedUnit ? (
                            <div className="no-unit-selected">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                <p>Select an Available Unit to configure ownership details</p>
                            </div>
                        ) : (
                            <>
                                <h3>Current Ownership</h3>
                                {activeOwners.length > 0 ? (
                                    activeOwners.map(owner => (
                                        <div key={owner.party_id} className="current-owner-card" style={{ marginBottom: '10px' }}>
                                            <div className="owner-info">
                                                <h4>
                                                    {owner.company_name || `${owner.first_name} ${owner.last_name}`}
                                                    {owner.share_percentage ? ` - Share: ${Number(owner.share_percentage)}%` : ''}
                                                </h4>
                                                <p>Since: {new Date(owner.start_date).toLocaleDateString()}</p>
                                            </div>
                                            <button className="remove-btn" onClick={() => handleRemoveOwner(owner)}>Remove</button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="current-owner-card" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                                        <div className="owner-info">
                                            <h4 style={{ color: '#64748b' }}>No Active Owner</h4>
                                        </div>
                                    </div>
                                )}
                                {/* Always show assign button so joint owners can be added */}
                                <button
                                    className="assign-btn"
                                    onClick={() => setIsAssignModalOpen(true)}
                                    style={{ marginTop: '12px' }}
                                >
                                    {activeOwners.length > 0 ? '+ Add Joint Owner' : 'Assign New Owner(s)'}
                                </button>

                                {activeOwners.length > 0 && (
                                    <>
                                        <div style={{ marginTop: '30px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3>Ownership Title Document Chain</h3>
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
                                            {documentTypes.map((type, index) => {
                                                const doc = documents.find(d => d.document_type_id === type.id);

                                                return (
                                                    <div key={index} className="doc-row" style={{
                                                        display: 'grid', gridTemplateColumns: '2fr 0.8fr 1.2fr 0.8fr', alignItems: 'center',
                                                        padding: '14px 20px', borderBottom: '1px solid #f1f5f9', background: '#fff'
                                                    }}>
                                                        {/* Document Name + Radio/Bullet */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            {/* Small circled bullet */}
                                                            <span style={{ fontSize: '20px', color: '#cbd5e1', lineHeight: '1', display: 'flex', alignItems: 'center' }}>○</span>
                                                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#334155' }}>
                                                                {type.name}
                                                            </span>
                                                        </div>

                                                        {/* Upload Column */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            {doc ? (
                                                                <span style={{ color: '#16a34a' }}>
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                                </span>
                                                            ) : (
                                                                <label className="upload-plus-btn" style={{
                                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                                    width: '28px', height: '28px', background: '#3b82f6', color: 'white',
                                                                    borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s'
                                                                }} title="Upload Document">
                                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                                                    <input type="file" hidden onChange={(e) => handleFileUpload(e, type.id)} />
                                                                </label>
                                                            )}
                                                        </div>

                                                        {/* Date Column */}
                                                        <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                                                            {doc ? new Date(doc.document_date).toLocaleDateString() : '11/1/26'}
                                                        </div>

                                                        {/* Action Column */}
                                                        <div style={{ textAlign: 'center' }}>
                                                            {doc ? (
                                                                <div className="action-icon-wrapper center">
                                                                    <button className="action-icon-btn view" onClick={() => viewDocument(doc)} title="View Document">
                                                                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: '#cbd5e1', display: 'inline-flex', alignItems: 'center' }} title="No document to view">
                                                                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {documentTypes.length === 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No document types configured.</div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <h3>Ownership History</h3>
                                <table className="history-table">
                                    <thead>
                                        <tr>
                                            <th>Owner Name</th>
                                            <th>Share %</th>
                                            <th>Status</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {unitOwners.map(o => (
                                            <tr key={o.id}>
                                                <td>{o.company_name || `${o.first_name} ${o.last_name}`}</td>
                                                <td>{o.share_percentage ? Number(o.share_percentage) : 100}%</td>
                                                <td>
                                                    <span className={`status-badge ${o.ownership_status.toLowerCase() === 'active' ? 'individual' : 'company'}`} style={{ background: o.ownership_status === 'Active' ? '#dcfce7' : '#f1f5f9', color: o.ownership_status === 'Active' ? '#166534' : '#64748b' }}>
                                                        {o.ownership_status}
                                                    </span>
                                                </td>
                                                <td>{new Date(o.start_date).toLocaleDateString()}</td>
                                                <td>{o.end_date ? new Date(o.end_date).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                        {unitOwners.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No history found</td></tr>}
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
                            fetchUnits(selectedProject); // refresh unit list
                            // keeping selected unit so we can manage its documents immediately
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
                const res = await partyAPI.getAllParties(search ? { search } : {});
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
            <div className="modal-content" style={{ maxWidth: '600px', width: '90%', position: 'relative' }}>
                {/* X close button - top right corner */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: '#f1f5f9', border: 'none', borderRadius: '50%',
                        width: '30px', height: '30px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', color: '#64748b', fontWeight: 'bold',
                        lineHeight: '1', zIndex: 10
                    }}
                    title="Close"
                >✕</button>
                <h3 style={{ paddingRight: '40px' }}>Assign Owner(s)</h3>
                
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>
                        Selected Joint Owners ({selectedOwners.length}/4)
                    </p>
                    
                    {selectedOwners.map(owner => (
                        <div key={owner.party.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', background: '#f0fdf4', padding: '10px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                            <div style={{ flex: 1 }}>
                                <strong style={{ color: '#166534' }}>{owner.party.company_name || `${owner.party.first_name} ${owner.party.last_name}`}</strong>
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
                            <button onClick={() => handleRemoveOwner(owner.party.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>X</button>
                        </div>
                    ))}
                    {selectedOwners.length === 0 && (
                        <div style={{ padding: '20px', background: '#fef3c7', color: '#92400e', textAlign: 'center', borderRadius: '6px', border: '1px solid #fde68a' }}>
                            <strong>No owners selected yet.</strong><br/>
                            <span style={{ fontSize: '13px' }}>Search and click on a party below to add as owner.</span>
                        </div>
                    )}
                    {selectedOwners.length > 0 && selectedOwners.length < 4 && (
                        <div style={{ padding: '10px', background: '#ecfdf5', color: '#065f46', textAlign: 'center', borderRadius: '6px', fontSize: '13px', marginTop: '10px' }}>
                            {selectedOwners.length === 1 ? 'You can add more joint owners, or proceed with single owner.' : `${4 - selectedOwners.length} more joint owner(s) can be added.`}
                        </div>
                    )}
                </div>

                {selectedOwners.length < 4 && (
                    <div className="form-group" style={{ position: 'relative', marginBottom: '8px' }}>
                        <label>Search Party to Add</label>
                        <input
                            className="form-input"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Type name, company, or email..."
                            autoComplete="off"
                        />
                        {/* Only show dropdown when search has text */}
                        {search.trim() && (
                            <div className="search-results" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #cbd5e1', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '4px' }}>
                                {parties.filter(p => {
                                    const q = search.toLowerCase();
                                    return (p.company_name || '').toLowerCase().includes(q)
                                        || (p.first_name || '').toLowerCase().includes(q)
                                        || (p.last_name || '').toLowerCase().includes(q)
                                        || (p.email || '').toLowerCase().includes(q);
                                }).length === 0 ? (
                                    <div style={{ padding: '10px', color: '#64748b', fontSize: '13px' }}>No matches found for "{search}"</div>
                                ) : (
                                    parties.filter(p => {
                                        const q = search.toLowerCase();
                                        return (p.company_name || '').toLowerCase().includes(q)
                                            || (p.first_name || '').toLowerCase().includes(q)
                                            || (p.last_name || '').toLowerCase().includes(q)
                                            || (p.email || '').toLowerCase().includes(q);
                                    }).map(p => (
                                        <div
                                            key={p.id}
                                            className="search-item"
                                            onClick={() => handleAddOwner(p)}
                                            style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#475569', flexShrink: 0 }}>
                                                {(p.company_name || p.first_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{p.company_name || `${p.first_name} ${p.last_name}`}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.type}{p.email ? ` | ${p.email}` : ''}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Assignment Date</label>
                    <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                
                {/* Always visible action buttons */}
                <div className="form-actions" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button className="btn-cancel" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer', fontWeight: '500' }} title="Cancel">Cancel</button>
                    <button 
                        className="btn-submit" 
                        onClick={handleAssign} 
                        disabled={selectedOwners.length === 0}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '6px', 
                            border: 'none', 
                            background: selectedOwners.length > 0 ? '#16a34a' : '#cbd5e1', 
                            color: '#fff', 
                            cursor: selectedOwners.length > 0 ? 'pointer' : 'not-allowed', 
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        {selectedOwners.length === 0 ? 'Select Owner(s) First' : `Assign ${selectedOwners.length} Owner${selectedOwners.length > 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OwnershipMapping;
