import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import { getProjects, structureAPI } from '../../services/api';

const UnitStructure = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [floors, setFloors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('blocks'); // 'blocks' | 'floors'

  // Forms
  const [blockForm, setBlockForm] = useState({ block_name: '', description: '', sort_order: '' });
  const [floorForm, setFloorForm] = useState({ floor_name: '', block_id: '', units_count: '', sort_order: '' });
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
      setBlockForm({ block_name: '', description: '', sort_order: '' });
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
      setFloorForm({ floor_name: '', block_id: '', units_count: '', sort_order: '' });
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

  /* ─── STYLES ─────────────────────────────────────────────────────────────── */
  const card = {
    background: '#fff', borderRadius: '12px', padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,.1)', marginBottom: '24px',
  };
  const badge = {
    display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
    fontSize: '12px', fontWeight: '600', background: '#EFF6FF', color: '#2563EB',
  };
  const inputStyle = {
    padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
    fontSize: '14px', width: '100%', boxSizing: 'border-box',
  };
  const btnPrimary = {
    padding: '9px 20px', background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
  };
  const btnDanger = {
    padding: '6px 14px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  };
  const btnSuccess = {
    padding: '6px 14px', background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0',
    borderRadius: '6px', cursor: 'pointer', fontSize: '13px', marginRight: '6px',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '250px', padding: '32px', overflowY: 'auto', minWidth: 0, boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '6px' }}>
            <Link to="/admin/dashboard" style={{ color: '#64748B', textDecoration: 'none' }}>HOME</Link>
            {' > '}<Link to="/admin/units" style={{ color: '#64748B', textDecoration: 'none' }}>UNITS</Link>
            {' > '}<span style={{ color: '#1E293B' }}>UNIT STRUCTURE</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: 0 }}>
            Unit Structure Management
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Define blocks and floors for each project. These drive the dropdowns in Unit Creation.
          </p>
        </header>

        {/* Project Selector */}
        <div style={card}>
          <label style={{ fontWeight: '600', fontSize: '14px', color: '#374151', display: 'block', marginBottom: '8px' }}>
            Select Project
          </label>
          <select
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
            style={{ ...inputStyle, maxWidth: '380px', fontWeight: '500' }}
          >
            <option value="">-- Choose a Project --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        {!selectedProject ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8', fontSize: '15px' }}>
            👆 Select a project above to manage its unit structure
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {['blocks', 'floors'].map(tab => (
                <button key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontWeight: '600', fontSize: '14px', textTransform: 'capitalize',
                    background: activeTab === tab ? '#2563EB' : '#fff',
                    color: activeTab === tab ? '#fff' : '#64748B',
                    boxShadow: activeTab === tab ? 'none' : '0 1px 3px rgba(0,0,0,.1)',
                  }}>
                  {tab === 'blocks' ? `🏢 Blocks (${blocks.length})` : `🏗️ Floors (${floors.length})`}
                </button>
              ))}
            </div>

            {loading && <p style={{ color: '#94A3B8' }}>Loading...</p>}

            {/* ─── BLOCKS TAB ──────────────────────────────────────────────── */}
            {activeTab === 'blocks' && (
              <>
                {/* Add Block Form */}
                <div style={card}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginTop: 0 }}>
                    Add New Block / Wing / Tower
                  </h3>
                  <form onSubmit={handleAddBlock}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Block Name *</label>
                        <input style={inputStyle} placeholder="e.g. Block A, Tower 1, North Wing"
                          value={blockForm.block_name}
                          onChange={e => setBlockForm({ ...blockForm, block_name: e.target.value })}
                          required />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Description</label>
                        <input style={inputStyle} placeholder="Optional description"
                          value={blockForm.description}
                          onChange={e => setBlockForm({ ...blockForm, description: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Sort Order</label>
                        <input style={inputStyle} type="number" placeholder="0" min="0"
                          value={blockForm.sort_order}
                          onChange={e => setBlockForm({ ...blockForm, sort_order: e.target.value })} />
                      </div>
                      <button type="submit" style={btnPrimary}>+ Add Block</button>
                    </div>
                  </form>
                </div>

                {/* Blocks List */}
                <div style={card}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginTop: 0, marginBottom: '16px' }}>
                    Blocks / Wings / Towers <span style={badge}>{blocks.length}</span>
                  </h3>
                  {blocks.length === 0 ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>No blocks defined yet. Add the first block above.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>#</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Block Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Description</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Sort</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Floors</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((block, i) => (
                          <tr key={block.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{i + 1}</td>
                            <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1E293B' }}>
                              {editingBlock?.id === block.id
                                ? <input style={inputStyle} value={editingBlock.block_name}
                                    onChange={e => setEditingBlock({ ...editingBlock, block_name: e.target.value })} />
                                : block.block_name}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748B' }}>
                              {editingBlock?.id === block.id
                                ? <input style={inputStyle} value={editingBlock.description || ''}
                                    onChange={e => setEditingBlock({ ...editingBlock, description: e.target.value })} />
                                : block.description || '—'}
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748B' }}>
                              {editingBlock?.id === block.id
                                ? <input style={{ ...inputStyle, width: '60px' }} type="number" value={editingBlock.sort_order}
                                    onChange={e => setEditingBlock({ ...editingBlock, sort_order: e.target.value })} />
                                : block.sort_order}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={badge}>{floors.filter(f => f.block_id === block.id).length} floors</span>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {editingBlock?.id === block.id ? (
                                <>
                                  <button style={btnSuccess} onClick={() => handleSaveBlock(block.id)}>✓ Save</button>
                                  <button style={btnDanger} onClick={() => setEditingBlock(null)}>✕</button>
                                </>
                              ) : (
                                <>
                                  <button style={{ ...btnSuccess, marginRight: '6px' }} onClick={() => setEditingBlock({ ...block })}>✎ Edit</button>
                                  <button style={btnDanger} onClick={() => handleDeleteBlock(block.id)}>🗑 Delete</button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

            {/* ─── FLOORS TAB ──────────────────────────────────────────────── */}
            {activeTab === 'floors' && (
              <>
                {/* Add Floor Form */}
                <div style={card}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginTop: 0 }}>
                    Add New Floor
                  </h3>
                  <form onSubmit={handleAddFloor}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Floor Name *</label>
                        <input style={inputStyle} placeholder="e.g. Ground Floor, 1F, Basement"
                          value={floorForm.floor_name}
                          onChange={e => setFloorForm({ ...floorForm, floor_name: e.target.value })}
                          required />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Block (Optional)</label>
                        <select style={inputStyle} value={floorForm.block_id}
                          onChange={e => setFloorForm({ ...floorForm, block_id: e.target.value })}>
                          <option value="">-- No specific block --</option>
                          {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Units Count</label>
                        <input style={inputStyle} type="number" placeholder="0" min="0"
                          value={floorForm.units_count}
                          onChange={e => setFloorForm({ ...floorForm, units_count: e.target.value })} />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Sort Order</label>
                        <input style={inputStyle} type="number" placeholder="0" min="0"
                          value={floorForm.sort_order}
                          onChange={e => setFloorForm({ ...floorForm, sort_order: e.target.value })} />
                      </div>
                      <button type="submit" style={btnPrimary}>+ Add Floor</button>
                    </div>
                  </form>
                </div>

                {/* Floors List */}
                <div style={card}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1E293B', marginTop: 0, marginBottom: '16px' }}>
                    Floors <span style={badge}>{floors.length}</span>
                  </h3>
                  {floors.length === 0 ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center', padding: '30px' }}>No floors defined yet. Add floors above.</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>#</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Floor Name</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Block</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Units Count</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Sort</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', color: '#64748B', fontWeight: '600' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floors.map((floor, i) => {
                          const blockName = blocks.find(b => b.id === floor.block_id)?.block_name || 'All Blocks';
                          return (
                            <tr key={floor.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '12px 16px', color: '#94A3B8' }}>{i + 1}</td>
                              <td style={{ padding: '12px 16px', fontWeight: '600', color: '#1E293B' }}>
                                {editingFloor?.id === floor.id
                                  ? <input style={inputStyle} value={editingFloor.floor_name}
                                      onChange={e => setEditingFloor({ ...editingFloor, floor_name: e.target.value })} />
                                  : floor.floor_name}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748B' }}>
                                {editingFloor?.id === floor.id
                                  ? <select style={inputStyle} value={editingFloor.block_id || ''}
                                      onChange={e => setEditingFloor({ ...editingFloor, block_id: e.target.value })}>
                                      <option value="">-- All Blocks --</option>
                                      {blocks.map(b => <option key={b.id} value={b.id}>{b.block_name}</option>)}
                                    </select>
                                  : <span style={badge}>{blockName}</span>}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748B' }}>
                                {editingFloor?.id === floor.id
                                  ? <input style={{ ...inputStyle, width: '80px' }} type="number" value={editingFloor.units_count}
                                      onChange={e => setEditingFloor({ ...editingFloor, units_count: e.target.value })} />
                                  : floor.units_count || 0}
                              </td>
                              <td style={{ padding: '12px 16px', color: '#64748B' }}>{floor.sort_order}</td>
                              <td style={{ padding: '12px 16px' }}>
                                {editingFloor?.id === floor.id ? (
                                  <>
                                    <button style={btnSuccess} onClick={() => handleSaveFloor(floor.id)}>✓ Save</button>
                                    <button style={btnDanger} onClick={() => setEditingFloor(null)}>✕</button>
                                  </>
                                ) : (
                                  <>
                                    <button style={{ ...btnSuccess, marginRight: '6px' }} onClick={() => setEditingFloor({ ...floor })}>✎ Edit</button>
                                    <button style={btnDanger} onClick={() => handleDeleteFloor(floor.id)}>🗑 Delete</button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </>
        )}
        </div>{/* end maxWidth wrapper */}
      </main>
    </div>
  );
};

export default UnitStructure;
