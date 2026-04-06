import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './EditUnit.css';
import { unitAPI, getProjectById, filterAPI, structureAPI } from '../../services/api';

const EditUnit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        unit_number: '',
        status: '',
        chargeable_area: '',
        projected_rent: '', // Changed from monthly_rent to match DB
        floor_number: '',
        block_tower: '', // Added
        unit_condition: '',
        plc: '',
        carpet_area: '',
        unit_category: '',
        unit_zoning_type: ''
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Image states
    const [images, setImages] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const fileInputRef = useRef(null);

    const [project, setProject] = useState(null);
    const [rentPerSqft, setRentPerSqft] = useState('');
    const [unitConditions, setUnitConditions] = useState([
        { value: 'fully_fitted', label: 'Fully Fitted' },
        { value: 'semi_fitted', label: 'Semi Fitted' },
        { value: 'bare_shell', label: 'Bare Shell' }
    ]);
    const [plcs, setPlcs] = useState([
        { value: 'front_facing', label: 'Front Facing' },
        { value: 'corner', label: 'Corner' },
        { value: 'park_facing', label: 'Park Facing' },
        { value: 'road_facing', label: 'Road Facing' }
    ]);
    const [unitCategories, setUnitCategories] = useState([]);
    const [unitZoningTypes, setUnitZoningTypes] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [floors, setFloors] = useState([]);

    useEffect(() => {
        const fetchUnitAndProject = async () => {
            try {
                const res = await unitAPI.getUnitById(id);
                const data = res.data;
                setFormData({
                    unit_number: data.unit_number || '',
                    status: data.status || 'vacant',
                    chargeable_area: data.chargeable_area || '',
                    projected_rent: data.projected_rent || '',
                    floor_number: data.floor_number || '',
                    block_tower: data.block_tower || '', // Added
                    unit_condition: data.unit_condition || 'bare_shell',
                    plc: data.plc || 'front_facing',
                    carpet_area: data.carpet_area || '',
                    covered_area: data.covered_area || '', // Ensure covered_area is also fetched
                    unit_category: data.unit_category || '',
                    unit_zoning_type: data.unit_zoning_type || '',
                    project_id: data.project_id
                });
                
                if (data.unit_images && data.unit_images.length > 0) {
                    setExistingImages(data.unit_images.map(img => img.image_path));
                } else if (data.unit_image) {
                    setExistingImages([{ image_path: data.unit_image }]);
                }

                // Calculate initial rent per sqft if rent exists
                if (data.projected_rent > 0 && data.chargeable_area > 0) { // Default to super area for initial display if needed, or just let it recalculate
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
        const fetchFilters = async () => {
            try {
                const ucRes = await filterAPI.getFilterOptions("unit_condition");
                if (ucRes.data.data.length > 0) {
                    setUnitConditions(ucRes.data.data.map(t => ({ value: t.option_value, label: t.option_value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })));
                }
                const plcRes = await filterAPI.getFilterOptions("plc");
                if (plcRes.data.data.length > 0) {
                    setPlcs(plcRes.data.data.map(t => ({ value: t.option_value, label: t.option_value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) })));
                }
                const catRes = await filterAPI.getFilterOptions("unit_category");
                if (catRes.data?.data?.length > 0) {
                    setUnitCategories(catRes.data.data.map(t => ({ value: t.option_value, label: t.option_value })));
                }
                const zoneRes = await filterAPI.getFilterOptions("unit_zoning_type");
                if (zoneRes.data?.data?.length > 0) {
                    setUnitZoningTypes(zoneRes.data.data.map(t => ({ value: t.option_value, label: t.option_value })));
                }
            } catch (error) {
                console.error("Error fetching filters", error);
            }
        };
        fetchUnitAndProject();
        fetchFilters();
    }, [id]);

    useEffect(() => {
        if (!formData.project_id) return;
        const loadStructure = async () => {
            try {
                const bRes = await structureAPI.getBlocks(formData.project_id);
                setBlocks((bRes.data?.data || []).map(b => b.block_name));
                const fRes = await structureAPI.getFloors({ project_id: formData.project_id });
                setFloors((fRes.data?.data || []).map(f => f.floor_name));
            } catch (err) {
                console.error("Failed to load unit structure", err);
            }
        };
        loadStructure();
    }, [formData.project_id]);

    useEffect(() => {
        if (!project || !rentPerSqft) return;

        const calcType = project.calculation_type || 'Chargeable Area';
        let area = 0;

        if (calcType === 'Covered Area') {
            area = parseFloat(formData.covered_area) || 0;
        } else if (calcType === 'Carpet Area') {
            area = parseFloat(formData.carpet_area) || 0;
        } else {
            area = parseFloat(formData.chargeable_area) || 0;
        }

        const rate = parseFloat(rentPerSqft);
        const total = area * rate;

        if (rate > 0) {
            setFormData(prev => ({
                ...prev,
                projected_rent: total > 0 ? total.toString() : ''
            }));
        }
    }, [formData.chargeable_area, formData.covered_area, formData.carpet_area, rentPerSqft, project]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages([...images, ...Array.from(e.target.files)]);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key] === null ? '' : formData[key]);
            });

            images.forEach(img => {
                data.append("images", img);
            });

            await unitAPI.updateUnit(id, data);

            setMessage("✅ Unit updated successfully");

            setTimeout(() => {
                navigate("/admin/units");
            }, 1500);

        } catch (err) {
            console.error(err);
            setError("❌ Failed to update unit");
        } finally {
            setIsSubmitting(false);
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
                                                <option value="occupied">Leased</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Block / Tower</label>
                                        {blocks.length > 0 ? (
                                            <div className="select-wrapper">
                                                <select name="block_tower" value={formData.block_tower} onChange={handleChange}>
                                                    <option value="">Select Block/Tower</option>
                                                    {blocks.map(b => (
                                                        <option key={b} value={b}>{b}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                name="block_tower"
                                                value={formData.block_tower}
                                                onChange={handleChange}
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Floor Number</label>
                                        {floors.length > 0 ? (
                                            <div className="select-wrapper">
                                                <select name="floor_number" value={formData.floor_number} onChange={handleChange}>
                                                    <option value="">Select Floor</option>
                                                    {floors.map(f => (
                                                        <option key={f} value={f}>{f}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <input
                                                type="text"
                                                name="floor_number"
                                                value={formData.floor_number}
                                                onChange={handleChange}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Chargeable Area (sq ft)</label>
                                    <input
                                        type="text"
                                        name="chargeable_area"
                                        value={formData.chargeable_area}
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
                                                x {project?.calculation_type || 'Chargeable Area'}
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
                                            {unitConditions.map(uc => (
                                                <option key={uc.value} value={uc.value}>{uc.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Category</label>
                                        <select name="unit_category" value={formData.unit_category} onChange={handleChange}>
                                            <option value="">Select Category</option>
                                            {unitCategories.map(uc => (
                                                <option key={uc.value} value={uc.value}>{uc.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Zoning Type</label>
                                        <select name="unit_zoning_type" value={formData.unit_zoning_type} onChange={handleChange}>
                                            <option value="">Select Zoning</option>
                                            {unitZoningTypes.map(uc => (
                                                <option key={uc.value} value={uc.value}>{uc.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Premium on Lease</label>
                                        <select name="plc" value={formData.plc} onChange={handleChange}>
                                            <option value="">Select Premium On Lease (Optional)</option>
                                            {plcs.map(plc => (
                                                <option key={plc.value} value={plc.value}>{plc.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Unit Images</label>
                                    <div className="upload-box dashed" onClick={handleUploadClick} style={{ border: '2px dashed #cbd5e1', padding: '20px', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px' }}>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            style={{ display: 'none' }}
                                        />
                                        <div className="upload-content">
                                            <span>Upload a file or drag and drop</span>
                                            <div className="upload-hint" style={{ fontSize: '12px', color: '#64748b' }}>PNG, JPG up to 10MB</div>
                                        </div>
                                    </div>
                                    
                                    {(images.length > 0 || existingImages.length > 0) && (
                                        <div style={{ marginTop: 15, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {existingImages.map((imgUrl, index) => (
                                                <div key={`existing-${index}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    <img src={imgUrl.image_path || imgUrl} alt={`preview-existing-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <div style={{ position: 'absolute', bottom: '0', width: '100%', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px 0' }}>Saved</div>
                                                </div>
                                            ))}
                                            {images.map((img, index) => (
                                                <div key={`new-${index}`} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                                    <img src={URL.createObjectURL(img)} alt={`preview-${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    <button type="button" onClick={() => {
                                                        const newImages = [...images];
                                                        newImages.splice(index, 1);
                                                        setImages(newImages);
                                                    }} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>&times;</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <div className="form-footer">
                                <Link to="/admin/units" className="cancel-btn">Cancel</Link>
                                <button type="submit" className="update-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Updating...' : 'Update Unit'}
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
