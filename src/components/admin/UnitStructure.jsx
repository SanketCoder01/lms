import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getProjects, structureAPI } from '../../services/api';
import './UnitStructure.css';

const UnitStructure = () => {
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [blocks, setBlocks] = useState([]);
    const [floors, setFloors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'floors'

    // Forms
    const [blockForm, setBlockForm] = useState({ block_name: '', description: '' });
    const [floorForm, setFloorForm] = useState({ floor_name: '', block_id: '', units_count: '' });
    const [editingBlock, setEditingBlock] = useState(null);
    const [editingFloor, setEditingFloor] = useState(null);

    // Load projects
    useEffect(() => {
        getProjects().then(res => {
            const data = res.data.data || res.data;
            setProjects(Array.isArray(data) ? data : []);
        }).catch(console.error);
    }, []);

    // Load blocks and floors whenever project changes
    const loadData = useCallback(async () => {
        if (!selectedProject) { setBlocks([]); setFloors([]); return; }
        setLoading(true);
        try {
            const [bRes, fRes] = await Promise.all([
                structureAPI.getBlocks(selectedProject),
                structureAPI.getFloors({ project_id: selectedProject }),
            ]);
            setBlocks(bRes.data.data || []);
            setFloors(fRes.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedProject]);

    useEffect(() => { loadData(); }, [loadData]);

    /* ─── BLOCK HANDLERS ─────────────────────────────────────────────────────── */
    const handleAddBlock = async (e) => {
        e.preventDefault();
        if (!selectedProject) return alert('Select a project first');
        try {
            await structureAPI.addBlock({ ...blockForm, project_id: selectedProject });
            setBlockForm({ block_name: '', description: '' });
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error adding block'); }
    };

    const handleSaveBlock = async (id) => {
        try {
            await structureAPI.updateBlock(id, editingBlock);
            setEditingBlock(null);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error updating block'); }
    };

    const handleDeleteBlock = async (id) => {
        if (!window.confirm('Delete this block? All its floors will also be deleted.')) return;
        try {
            await structureAPI.deleteBlock(id);
            loadData();
        } catch (err) { alert('Error deleting block'); }
    };

    /* ─── FLOOR HANDLERS ─────────────────────────────────────────────────────── */
    const handleAddFloor = async (e) => {
        e.preventDefault();
        if (!selectedProject) return alert('Select a project first');
        try {
            await structureAPI.addFloor({ ...floorForm, project_id: selectedProject });
            setFloorForm({ floor_name: '', block_id: '', units_count: '' });
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error adding floor'); }
    };

    const handleSaveFloor = async (id) => {
        try {
            await structureAPI.updateFloor(id, editingFloor);
            setEditingFloor(null);
            loadData();
        } catch (err) { alert(err.response?.data?.message || 'Error updating floor'); }
    };

    const handleDeleteFloor = async (id) => {
        if (!window.confirm('Delete this floor?')) return;
        try {
            await structureAPI.deleteFloor(id);
            loadData();
        } catch (err) { alert('Error deleting floor'); }
    };

    return (
        <div className="unit-structure-container">
            <Sidebar />
            <main className="unit-structure-main">
                <div className="unit-structure-wrapper">
                    <header className="unit-structure-header">
                        <div className="breadcrumb-nav">
                            <Link to="/admin/dashboard">HOME</Link>
                            {' > '}<Link to="/admin/units">UNITS</Link>
                            {' > '}<span>UNIT STRUCTURE</span>
                        </div>
                        <h1>Unit Structure Management</h1>
                        <p>Define blocks and floors for each project. These drive the dropdowns in Unit Creation.</p>
                    </header>

                    {/* Project Selector */}
                    <div className="structure-card">
                        <div className="form-group-structure">
                            <label>Select Project</label>
                            <select
                                value={selectedProject}
                                onChange={e => setSelectedProject(e.target.value)}
                                className="structure-input"
                                style={{ maxWidth: '380px' }}
                            >
                                <option value="">-- Choose a Project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!selectedProject ? (
                        <div className="structure-card" style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
                            👆 Select a project above to manage its unit structure
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="tabs-container">
                                {['blocks', 'floors'].map(tab => (
                                    <button key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}>
                                        {tab === 'blocks' ? `🏢 Blocks (${blocks.length})` : `🏗️ Floors (${floors.length})`}
                                    </button>
                                ))}
                            </div>

                            {loading && <p style={{ color: '#94A3B8', marginBottom: '16px' }}>Loading data...</p>}

                            {/* ─── BLOCKS TAB ──────────────────────────────────────────────── */}
                            {activeTab === 'blocks' && (
                                <>
                                    {/* Add Block Form */}
                                    <div className="structure-card">
                                        <h3>Add New Block / Wing / Tower</h3>
                                        <form onSubmit={handleAddBlock}>
                                            <div className="block-form-grid">
                                                <div className="form-group-structure">
                                                    <label>Block Name *</label>
                                                    <input className="structure-input" placeholder="e.g. Block A, Tower 1"
                                                        value={blockForm.block_name}
                                                        onChange={e => setBlockForm({ ...blockForm, block_name: e.target.value })}
                                                        required />
                                                </div>
                                                <div className="form-group-structure">
                                                    <label>Description</label>
                                                    <input className="structure-input" placeholder="Optional description"
                                                        value={blockForm.description}
                                                        onChange={e => setBlockForm({ ...blockForm, description: e.target.value })} />
                                                </div>
                                                                                                <button type="submit" className="btn-primary-structure">+ Add Block</button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Blocks List */}
                                    <div className="structure-card">
                                        <h3>Blocks / Wings / Towers <span className="badge-structure">{blocks.length}</span></h3>
                                        <div className="structure-table-container">
                                            {blocks.length === 0 ? (
                                                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>No blocks defined yet.</p>
                                            ) : (
                                                <table className="structure-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Block Name</th>
                                                            <th>Description</th>
                                                            <th>Floors</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {blocks.map((block, i) => (
                                                            <tr key={block.id}>
                                                                <td style={{ color: '#94A3B8' }}>{i + 1}</td>
                                                                <td style={{ fontWeight: '600', color: '#1E293B' }}>
                                                                    {editingBlock?.id === block.id
                                                                        ? <input className="structure-input" value={editingBlock.block_name}
                                                                            onChange={e => setEditingBlock({ ...editingBlock, block_name: e.target.value })} />
                                                                        : block.block_name}
                                                                </td>
                                                                <td style={{ color: '#64748B' }}>
                                                                    {editingBlock?.id === block.id
                                                                        ? <input className="structure-input" value={editingBlock.description || ''}
                                                                            onChange={e => setEditingBlock({ ...editingBlock, description: e.target.value })} />
                                                                        : block.description || '—'}
                                                                </td>
                                                                <td>
                                                                    <span className="badge-structure">{floors.filter(f => f.block_id === block.id).length} floors</span>
                                                                </td>
                                                                <td>
                                                                    {editingBlock?.id === block.id ? (
                                                                        <div style={{ display: 'flex' }}>
                                                                            <button className="btn-success-structure" onClick={() => handleSaveBlock(block.id)}>Save</button>
                                                                            <button className="btn-danger-structure" onClick={() => setEditingBlock(null)}>✕</button>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ display: 'flex' }}>
                                                                            <button className="btn-success-structure" onClick={() => setEditingBlock({ ...block })}>Edit</button>
                                                                            <button className="btn-danger-structure" onClick={() => handleDeleteBlock(block.id)}>Delete</button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ─── FLOORS TAB ──────────────────────────────────────────────── */}
                            {activeTab === 'floors' && (
                                <>
                                    {/* Add Floor Form */}
                                    <div className="structure-card">
                                        <h3>Add New Floor</h3>
                                        <form onSubmit={handleAddFloor}>
                                            <div className="floor-form-grid">
                                                <div className="form-group-structure">
                                                    <label>Floor Name *</label>
                                                    <input className="structure-input" placeholder="e.g. Ground Floor"
                                                        value={floorForm.floor_name}
                                                        onChange={e => setFloorForm({ ...floorForm, floor_name: e.target.value })}
                                                        required />
                                                </div>
                                                <div className="form-group-structure">
                                                    <label>Block (Optional)</label>
                                                    <select className="structure-input" value={floorForm.block_id}
                                                        onChange={e => setFloorForm({ ...floorForm, block_id: e.target.value })}>
                                                        <option value="">-- No specific block --</option>
                                                        {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="form-group-structure">
                                                    <label>Units Count</label>
                                                    <input className="structure-input" type="number" placeholder="0" min="0"
                                                        value={floorForm.units_count}
                                                        onChange={e => setFloorForm({ ...floorForm, units_count: e.target.value })} />
                                                </div>
                                                                                                <button type="submit" className="btn-primary-structure">+ Add Floor</button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Floors List */}
                                    <div className="structure-card">
                                        <h3>Floors <span className="badge-structure">{floors.length}</span></h3>
                                        <div className="structure-table-container">
                                            {floors.length === 0 ? (
                                                <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>No floors defined yet.</p>
                                            ) : (
                                                <table className="structure-table">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Floor Name</th>
                                                            <th>Block</th>
                                                            <th>Units Count</th>
                                                            <th>Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {floors.map((floor, i) => {
                                                            const blockName = blocks.find(b => b.id === floor.block_id)?.block_name || 'All Blocks';
                                                            return (
                                                                <tr key={floor.id}>
                                                                    <td style={{ color: '#94A3B8' }}>{i + 1}</td>
                                                                    <td style={{ fontWeight: '600', color: '#1E293B' }}>
                                                                        {editingFloor?.id === floor.id
                                                                            ? <input className="structure-input" value={editingFloor.floor_name}
                                                                                onChange={e => setEditingFloor({ ...editingFloor, floor_name: e.target.value })} />
                                                                            : floor.floor_name}
                                                                    </td>
                                                                    <td>
                                                                        {editingFloor?.id === floor.id
                                                                            ? <select className="structure-input" value={editingFloor.block_id || ''}
                                                                                onChange={e => setEditingFloor({ ...editingFloor, block_id: e.target.value })}>
                                                                                <option value="">-- All Blocks --</option>
                                                                                {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                                                                            </select>
                                                                            : <span className="badge-structure">{blockName}</span>}
                                                                    </td>
                                                                    <td>
                                                                        {editingFloor?.id === floor.id
                                                                            ? <input className="structure-input" style={{ width: '80px' }} type="number" value={editingFloor.units_count}
                                                                                onChange={e => setEditingFloor({ ...editingFloor, units_count: e.target.value })} />
                                                                            : floor.units_count || 0}
                                                                    </td>
                                                                    <td>
                                                                        {editingFloor?.id === floor.id ? (
                                                                            <div style={{ display: 'flex' }}>
                                                                                <button className="btn-success-structure" onClick={() => handleSaveFloor(floor.id)}>Save</button>
                                                                                <button className="btn-danger-structure" onClick={() => setEditingFloor(null)}>✕</button>
                                                                            </div>
                                                                        ) : (
                                                                            <div style={{ display: 'flex' }}>
                                                                                <button className="btn-success-structure" onClick={() => setEditingFloor({ ...floor })}>Edit</button>
                                                                                <button className="btn-danger-structure" onClick={() => handleDeleteFloor(floor.id)}>Delete</button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default UnitStructure;
