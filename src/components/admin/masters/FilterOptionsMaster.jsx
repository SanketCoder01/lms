import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { filterAPI } from '../../../services/api';
import '../Master.css';

const FilterOptionsMaster = () => {
    const [options, setOptions] = useState([]);
    const [newOption, setNewOption] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('project_type');
    const [loading, setLoading] = useState(true);

    const categories = [
        { value: 'project_type', label: 'Project Types' },
        { value: 'unit_condition', label: 'Unit Conditions' },
        { value: 'plc', label: 'PLC Types' },
        { value: 'lease_status', label: 'Lease Statuses' },
        { value: 'brand_category', label: 'Brand Categories' }
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
            alert("Failed to add option: " + (error.response?.data?.error || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this filter option?')) {
            try {
                await filterAPI.deleteFilterOption(id);
                fetchOptions();
            } catch (error) {
                alert("Failed to delete option");
            }
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <header className="page-header">
                    <div className="breadcrumb">
                        <Link to="/admin/dashboard">HOME</Link> &gt; <Link to="/admin/parties">MASTERS</Link> &gt; FILTER OPTIONS
                    </div>
                    <h1>Filter Options</h1>
                    <p>Manage dynamic dropdowns and filter options across the admin panel.</p>
                </header>

                <div className="content-card">
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Category:</label>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            {categories.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>

                    <form onSubmit={handleAdd} className="add-master-form" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={`Enter New ${categories.find(c => c.value === selectedCategory)?.label.slice(0, -1)}`}
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        />
                        <button type="submit" className="primary-btn">Add Option</button>
                    </form>

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Option Value</th>
                                <th>Status</th>
                                <th style={{width: '100px'}}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {options.map(opt => (
                                <tr key={opt.id}>
                                    <td>{opt.id}</td>
                                    <td>{opt.option_value}</td>
                                    <td><span className="status-badge active">Active</span></td>
                                    <td>
                                        <button 
                                            onClick={() => handleDelete(opt.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', textDecoration: 'underline' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {options.length === 0 && !loading && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No options found.</td></tr>
                            )}
                            {loading && (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading...</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default FilterOptionsMaster;
