import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { filterAPI, handleApiError } from '../../../services/api';
import '../Master.css';
import usePermissions from '../../../hooks/usePermissions';

const FilterOptionsMaster = () => {
    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('project_type');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');
    const { can } = usePermissions();

    const categories = [
        { value: 'project_type', label: 'Project Types', hint: 'Used in Add Project → Project Type dropdown' },
        { value: 'unit_condition', label: 'Unit Conditions', hint: 'Used in Add Unit → Unit Condition dropdown' },
        { value: 'plc', label: 'PLC (Premium on Lease)', hint: 'Used in Add Unit → Premium on Lease dropdown' },
        { value: 'unit_category', label: 'Unit Categories', hint: 'Used in Add Unit → Unit Category dropdown' },
        { value: 'unit_zoning_type', label: 'Unit Zoning Types', hint: 'Used in Add Unit → Unit Zoning Type dropdown AND Add/Edit Party → Brand/Investor Category dropdown' },
        { value: 'brand_category', label: 'Brand Categories', hint: 'Used in Add Party → Brand Category dropdown' },
        { value: 'block_tower', label: 'Block / Tower Names', hint: 'Used in Add Unit → Block/Tower dropdown' },
        { value: 'floor_number', label: 'Floor Numbers', hint: 'Used in Add Unit → Floor Number dropdown' },
        { value: 'lease_status', label: 'Lease Statuses', hint: 'Used for lease status classifications' },
        { value: 'Owner Grouping', label: 'Owner Groupings', hint: 'Used in Add/Edit Party → Grouping of Owners dropdown (when Party Type = Owner)' },
        { value: 'Party Type', label: 'Party Types', hint: 'Used in Add/Edit Party → Party Type dropdown (Tenant, Owner, Lessor, Sub-Lessee, etc.)' },
    ];

    useEffect(() => {
        fetchOptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);

    const fetchOptions = async () => {
        try {
            setLoading(true);
            const res = await filterAPI.getFilterOptions(selectedCategory);
            setOptions(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch filter options", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newOption.trim()) return;
        try {
            await filterAPI.addFilterOption({ category: selectedCategory, option_value: newOption.trim() });
            setNewOption('');
            fetchOptions();
        } catch (error) {
            alert("Failed to add option: " + handleApiError(error));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this filter option?')) {
            try {
                await filterAPI.deleteFilterOption(id);
                fetchOptions();
            } catch (error) {
                alert("Failed to delete option: " + handleApiError(error));
            }
        }
    };

    const startEdit = (opt) => {
        setEditingId(opt.id);
        setEditValue(opt.option_value);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleUpdate = async (id) => {
        if (!editValue.trim()) return;
        try {
            await filterAPI.updateFilterOption(id, { option_value: editValue.trim() });
            setEditingId(null);
            fetchOptions();
        } catch (error) {
            alert("Failed to update option: " + handleApiError(error));
        }
    };

    const currentCategory = categories.find(c => c.value === selectedCategory);

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/admin/dashboard">HOME</Link> &gt; MASTERS &gt; FILTER OPTIONS
                    </div>
                    <h1>Filter Options Manager</h1>
                    <p>Centrally manage all dynamic dropdown values used throughout the application.</p>
                </header>

                <div className="content-card">
                    {/* Category Selector */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#374151' }}>
                            Select Category:
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {categories.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setSelectedCategory(c.value)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '16px',
                                        border: selectedCategory === c.value ? '2px solid #2E66FF' : '1px solid #e5e7eb',
                                        background: selectedCategory === c.value ? '#EBF2FF' : '#fff',
                                        color: selectedCategory === c.value ? '#2E66FF' : '#374151',
                                        fontWeight: selectedCategory === c.value ? '600' : '400',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        transition: 'all 0.2s',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '150px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                    title={c.label}
                                >
                                    {c.label}
                                </button>
                            ))}
                        </div>
                        {currentCategory?.hint && (
                            <p style={{ marginTop: '10px', fontSize: '13px', color: '#6B7280', fontStyle: 'italic' }}>
                                ℹ️ {currentCategory.hint}
                            </p>
                        )}
                    </div>

                    {/* Add New Option Form */}
                    <form onSubmit={handleAdd} style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={`Add new ${currentCategory?.label?.replace(/s$/, '') || 'option'}...`}
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            style={{ maxWidth: '400px', padding: '9px 14px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                            disabled={!can('edit')}
                        />
                        {can('edit') ? (
                            <button type="submit" className="primary-btn">+ Add Option</button>
                        ) : (
                            <button type="button" disabled className="primary-btn" style={{ opacity: 0.5, cursor: 'not-allowed' }}>🔒 Add Option</button>
                        )}
                    </form>

                    {/* Options Table */}
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '60px' }}>#</th>
                                <th>Option Value</th>
                                <th style={{ width: '100px' }}>Status</th>
                                <th style={{ width: '160px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {options.map((opt, idx) => (
                                <tr key={opt.id}>
                                    <td style={{ color: '#9CA3AF' }}>{idx + 1}</td>
                                    <td>
                                        {editingId === opt.id ? (
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #2E66FF', fontSize: '14px', width: '100%', maxWidth: '300px' }}
                                                autoFocus
                                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(opt.id); if (e.key === 'Escape') cancelEdit(); }}
                                            />
                                        ) : (
                                            <span style={{ fontWeight: '500' }}>{opt.option_value}</span>
                                        )}
                                    </td>
                                    <td><span className="status-badge active">Active</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {editingId === opt.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(opt.id)}
                                                        style={{ background: '#16A34A', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                                    >Save</button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        style={{ background: '#6B7280', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                                    >Cancel</button>
                                                </>
                                            ) : (
                                                <>
                                                    {can('edit') ? (
                                                        <button
                                                            onClick={() => startEdit(opt)}
                                                            style={{ background: 'none', border: '1px solid #2E66FF', color: '#2E66FF', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                                        >Edit</button>
                                                    ) : (
                                                        <button disabled title="No edit permission" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', borderRadius: '4px', padding: '4px 10px', cursor: 'not-allowed', fontSize: '12px' }}>🔒 Edit</button>
                                                    )}
                                                    {can('delete') ? (
                                                        <button
                                                            onClick={() => handleDelete(opt.id)}
                                                            style={{ background: 'none', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '4px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px' }}
                                                        >Delete</button>
                                                    ) : (
                                                        <button disabled title="No delete permission" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#94a3b8', borderRadius: '4px', padding: '4px 10px', cursor: 'not-allowed', fontSize: '12px' }}>🔒 Delete</button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {options.length === 0 && !loading && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF' }}>
                                    No options found for this category. Add one above.
                                </td></tr>
                            )}
                            {loading && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#9CA3AF' }}>Loading...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default FilterOptionsMaster;
