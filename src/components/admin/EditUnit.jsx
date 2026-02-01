import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './EditUnit.css';
import { unitAPI, getProjectById } from '../../services/api';

const EditUnit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        unit_number: '',
        status: '',
        super_area: '',
        projected_rent: '', // Changed from monthly_rent to match DB
        floor_number: '',
        block_tower: '', // Added
        unit_condition: '',
        plc: '',
        carpet_area: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [project, setProject] = useState(null);
    const [rentPerSqft, setRentPerSqft] = useState('');

    useEffect(() => {
        const fetchUnitAndProject = async () => {
            try {
                const res = await unitAPI.getUnitById(id);
                const data = res.data;
                setFormData({
                    unit_number: data.unit_number || '',
                    status: data.status || 'vacant',
                    super_area: data.super_area || '',
                    projected_rent: data.projected_rent || '',
                    floor_number: data.floor_number || '',
                    block_tower: data.block_tower || '', // Added
                    unit_condition: data.unit_condition || 'bare_shell',
                    plc: data.plc || 'front_facing',
                    carpet_area: data.carpet_area || '',
                    covered_area: data.covered_area || '', // Ensure covered_area is also fetched
                    project_id: data.project_id
                });

                // Calculate initial rent per sqft if rent exists
                if (data.projected_rent > 0 && data.super_area > 0) { // Default to super area for initial display if needed, or just let it recalculate
                    // Actually better to not reverse calculate to avoid rounding errors, just let user enter new rate if they want to change
                }

                if (data.project_id) {
                    const projRes = await getProjectById(data.project_id);
                    setProject(projRes.data.data || projRes.data);
                }
            } catch (err) {
                console.error("Error fetching unit:", err);
                setError("Failed to load unit details");
            }
        };
        fetchUnitAndProject();
    }, [id]);

    useEffect(() => {
        if (!project || !rentPerSqft) return;

        const calcType = project.calculation_type || 'Super Area';
        let area = 0;

        if (calcType === 'Covered Area') {
            area = parseFloat(formData.covered_area) || 0;
        } else if (calcType === 'Carpet Area') {
            area = parseFloat(formData.carpet_area) || 0;
        } else {
            area = parseFloat(formData.super_area) || 0;
        }

        const rate = parseFloat(rentPerSqft);
        const total = area * rate;

        if (rate > 0) {
            setFormData(prev => ({
                ...prev,
                projected_rent: total > 0 ? total.toString() : ''
            }));
        }
    }, [formData.super_area, formData.covered_area, formData.carpet_area, rentPerSqft, project]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            await unitAPI.updateUnit(id, formData);

            setMessage("✅ Unit updated successfully");

            setTimeout(() => {
                navigate("/admin/units");
            }, 1500);

        } catch (err) {
            console.error(err);
            setError("❌ Failed to update unit");
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="edit-unit-container">
                    <div className="unit-form-card">

                        {/* Header */}
                        <div className="edit-header">
                            <div className="header-content">
                                <div className="breadcrumb">
                                    <Link to="/admin/dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>HOME</Link> &gt;{' '}
                                    <Link to="/admin/units" style={{ textDecoration: 'none', color: 'inherit' }}>UNITS</Link> &gt;{' '}
                                    <span className="active">UNIT {formData.unit_number}</span>
                                </div>
                                <div className="title-row">
                                    <h2>Edit Unit: {formData.unit_number}</h2>
                                </div>
                                <p className="subtitle">
                                    Update current lease details, status, pricing, and amenities for this unit.
                                </p>
                            </div>
                        </div>

                        {message && <div className="success-msg">{message}</div>}
                        {error && <div className="error-msg">{error}</div>}

                        <form className="unit-form" onSubmit={handleUpdate}>

                            {/* Unit Identification */}
                            <section className="form-section">
                                <h3>Unit Identification</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Unit Number</label>
                                        <input
                                            type="text"
                                            name="unit_number"
                                            value={formData.unit_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Status</label>
                                        <div className="select-wrapper">
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                            >
                                                <option value="vacant">Vacant</option>
                                                <option value="occupied">Occupied</option>
                                                <option value="reserved">Reserved</option>
                                                <option value="under_maintenance">Under Maintenance</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Block / Tower</label>
                                        <input
                                            type="text"
                                            name="block_tower"
                                            value={formData.block_tower}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Floor Number</label>
                                        <input
                                            type="text"
                                            name="floor_number"
                                            value={formData.floor_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Super Area (sq ft)</label>
                                    <input
                                        type="text"
                                        name="super_area"
                                        value={formData.super_area}
                                        onChange={handleChange}
                                    />
                                </div>
                            </section>

                            {/* Lease details section if needed, or just rent */}
                            <section className="form-section">
                                <h3>Rent & Details</h3>
                                <div className="form-row">
                                    <label>Projected Rent (₹)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="number"
                                                value={rentPerSqft}
                                                onChange={(e) => setRentPerSqft(e.target.value)}
                                                placeholder="Proj. Rent/sqft"
                                                style={{ width: '100px' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#666' }}>
                                                x {project?.calculation_type || 'Super Area'}
                                            </span>
                                        </div>
                                        <input
                                            type="text"
                                            name="projected_rent"
                                            value={formData.projected_rent}
                                            readOnly
                                            style={{ backgroundColor: '#f9fafb' }}
                                            placeholder="Total Rent"
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Covered Area (sq ft)</label>
                                    <input
                                        type="text"
                                        name="covered_area"
                                        value={formData.covered_area || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Carpet Area (sq ft)</label>
                                    <input
                                        type="text"
                                        name="carpet_area"
                                        value={formData.carpet_area || ''}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>Unit Condition</label>
                                        <select name="unit_condition" value={formData.unit_condition} onChange={handleChange}>
                                            <option value="fully_fitted">Fully Fitted</option>
                                            <option value="semi_fitted">Semi Fitted</option>
                                            <option value="bare_shell">Bare Shell</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>PLC</label>
                                        <select name="plc" value={formData.plc} onChange={handleChange}>
                                            <option value="front_facing">Front Facing</option>
                                            <option value="corner">Corner</option>
                                            <option value="park_facing">Park Facing</option>
                                            <option value="road_facing">Road Facing</option>
                                        </select>
                                    </div>
                                </div>
                            </section>

                            <div className="form-footer">
                                <Link to="/admin/units" className="cancel-btn">Cancel</Link>
                                <button type="submit" className="update-btn">
                                    Update Unit
                                </button>
                            </div>

                        </form>
                    </div >
                </div >
            </main >
        </div >
    );
};

export default EditUnit;
