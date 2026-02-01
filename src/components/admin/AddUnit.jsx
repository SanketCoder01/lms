import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { unitAPI, getProjects } from '../../services/api';
import './AddUnit.css';

const AddUnit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    // const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);

    // Get projectId from URL params if available
    const queryParams = new URLSearchParams(location.search);
    const preSelectedProjectId = queryParams.get('projectId') || '';

    const [formData, setFormData] = useState({
        project_id: preSelectedProjectId,
        unit_number: '',
        floor_number: '',
        block_tower: '', // Added
        super_area: '',
        carpet_area: '',
        covered_area: '',
        unit_condition: 'fully_fitted',
        plc: 'front_facing',
        projected_rent: ''
    });

    const [images, setImages] = useState([]);
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await getProjects();
                setProjects(res.data.data || res.data);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };
        fetchProjects();
    }, []);

    // State for the unit input suffix (e.g., "101")
    const [unitSuffix, setUnitSuffix] = useState('');
    const [rentPerSqft, setRentPerSqft] = useState('');

    // State for validation errors
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Find selected project to get calculation basis
        const selectedProject = projects.find(p => p.id === parseInt(formData.project_id));
        const calcType = selectedProject?.calculation_type || 'Super Area';

        let area = 0;
        if (calcType === 'Covered Area') {
            area = parseFloat(formData.covered_area) || 0;
        } else if (calcType === 'Carpet Area') {
            area = parseFloat(formData.carpet_area) || 0;
        } else {
            area = parseFloat(formData.super_area) || 0;
        }

        const rate = parseFloat(rentPerSqft) || 0;
        const total = area * rate;

        setFormData(prev => ({
            ...prev,
            projected_rent: total > 0 ? total.toString() : ''
        }));
    }, [formData.super_area, formData.covered_area, formData.carpet_area, formData.project_id, rentPerSqft, projects]);

    // Validation Effect
    useEffect(() => {
        const superArea = parseFloat(formData.super_area) || 0;
        const coveredArea = parseFloat(formData.covered_area) || 0;
        const carpetArea = parseFloat(formData.carpet_area) || 0;

        const newErrors = {};

        if (formData.covered_area && superArea > 0 && coveredArea >= superArea) {
            newErrors.covered_area = "Must be less than Super Area";
        }

        if (formData.carpet_area && coveredArea > 0 && carpetArea >= coveredArea) {
            newErrors.carpet_area = "Must be less than Covered Area";
        } else if (formData.carpet_area && superArea > 0 && carpetArea >= superArea) {
            // Fallback if covered area is missing but super area exists
            newErrors.carpet_area = "Must be less than Super Area";
        }

        setErrors(newErrors);
    }, [formData.super_area, formData.covered_area, formData.carpet_area]);

    // Specific handler for Floor Selection
    const handleFloorChange = (e) => {
        const newFloor = e.target.value;
        const currentSuffix = unitSuffix;
        const currentBlock = formData.block_tower;

        // Update floor and combine logic
        setFormData(prev => ({
            ...prev,
            floor_number: newFloor,
            unit_number: generateUnitNumber(currentBlock, newFloor, currentSuffix)
        }));
    };

    // Specific handler for Unit Suffix Input
    const handleUnitSuffixChange = (e) => {
        const newSuffix = e.target.value;
        setUnitSuffix(newSuffix);
        const currentBlock = formData.block_tower;

        // Combine logic using current floor state
        setFormData(prev => {
            const currentFloor = prev.floor_number;
            return {
                ...prev,
                unit_number: generateUnitNumber(currentBlock, currentFloor, newSuffix)
            };
        });
    };

    // Helper to generate unit number string
    const generateUnitNumber = (block, floor, suffix) => {
        // Format: [Block]-[Floor]-[Suffix] or [Floor]-[Suffix]
        let parts = [];
        if (block) parts.push(block);
        if (floor) parts.push(floor);
        if (suffix) parts.push(suffix);
        return parts.join('-');
    };

    // Generic handler needs to handle block_tower change specially to update unit_number
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            if (name === 'block_tower') {
                newState.unit_number = generateUnitNumber(value, prev.floor_number, unitSuffix);
            }

            return newState;
        });
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitMessage('');

        if (!formData.project_id) {
            setSubmitMessage("Please select a project.");
            setIsSubmitting(false);
            return;
        }

        if (Object.keys(errors).length > 0) {
            setSubmitMessage("Please fix validation errors before submitting.");
            setIsSubmitting(false);
            return;
        }

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });

            images.forEach(img => {
                data.append("images", img);
            });

            await unitAPI.createUnit(data);

            setSubmitMessage('Unit created successfully!');
            setTimeout(() => navigate('/admin/units'), 2000);

        } catch (error) {
            console.error("Create unit failed:", error);
            setSubmitMessage('Failed to create unit. ' + (error.response?.data?.message || 'Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dashboard-container">
            <Sidebar />
            <main className="main-content">
                <div className="add-unit-container">
                    <div className="unit-form-card">
                        <div className="form-header">
                            <div className="header-titles">
                                <h2>Add New Units</h2>
                                <p>Fill in the details below to register a new property unit.</p>
                            </div>
                            <Link to="/admin/units" className="close-btn">✕</Link>
                        </div>

                        <form className="unit-form" onSubmit={handleSubmit}>
                            {/* Section 1 */}
                            <section className="form-section">
                                <h3>Location & Identification</h3>
                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label>Project / Building</label>
                                        <div className="select-wrapper">
                                            <select name="project_id" value={formData.project_id} onChange={handleChange} required>
                                                <option value="">Select Project</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Block / Tower (Optional)</label>
                                        <input
                                            type="text"
                                            name="block_tower"
                                            value={formData.block_tower}
                                            onChange={handleChange}
                                            placeholder="e.g. A, B, Tower 1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Floor Number</label>
                                        <div className="select-wrapper">
                                            <select
                                                name="floor_number"
                                                value={formData.floor_number}
                                                onChange={handleFloorChange}
                                                required
                                            >
                                                <option value="">Select Floor</option>
                                                {['GF', 'FF', 'SF', 'TF', '4F', '5F', '6F', '7F', '8F', '9F', '10F'].map(f => (
                                                    <option key={f} value={f}>{f}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Unit Number (Suffix)</label>
                                        <input
                                            type="text"
                                            value={unitSuffix}
                                            onChange={handleUnitSuffixChange}
                                            placeholder="e.g., 101"
                                            required
                                        />
                                        <small style={{ display: 'block', marginTop: '5px', color: 'gray' }}>
                                            Final Unit No: <strong>
                                                {formData.block_tower ? `${formData.block_tower}-` : ''}
                                                {formData.floor_number ? `${formData.floor_number}-` : ''}
                                                {unitSuffix}
                                            </strong>
                                            <br />
                                            <em style={{ fontSize: '0.8rem' }}>(Will be saved as: {formData.block_tower ? `${formData.block_tower}-${formData.floor_number}-${unitSuffix}` : `${formData.floor_number}-${unitSuffix}`})</em>
                                        </small>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section className="form-section">
                                <h3>Specifications & Dimensions</h3>
                                <div className="form-row three-cols">
                                    <div className="form-group">
                                        <label>Super Area (sq ft)</label>
                                        <input
                                            type="number"
                                            name="super_area"
                                            value={formData.super_area}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Covered Area (sq ft)</label>
                                        <input
                                            type="number"
                                            name="covered_area"
                                            value={formData.covered_area}
                                            onChange={handleChange}
                                            style={{ borderColor: errors.covered_area ? 'red' : undefined }}
                                        />
                                        {errors.covered_area && <span style={{ color: 'red', fontSize: '12px' }}>{errors.covered_area}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>Carpet Area (sq ft)</label>
                                        <input
                                            type="number"
                                            name="carpet_area"
                                            value={formData.carpet_area}
                                            onChange={handleChange}
                                            style={{ borderColor: errors.carpet_area ? 'red' : undefined }}
                                        />
                                        {errors.carpet_area && <span style={{ color: 'red', fontSize: '12px' }}>{errors.carpet_area}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group half-width">
                                        <label>Unit Condition</label>
                                        <div className="select-wrapper">
                                            <select name="unit_condition" value={formData.unit_condition} onChange={handleChange}>
                                                <option value="fully_fitted">Fully Fitted</option>
                                                <option value="semi_fitted">Semi Fitted</option>
                                                <option value="bare_shell">Bare Shell</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 - Status & Media */}
                            <section className="form-section">
                                <h3>Commercials</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>PLC</label>
                                        <div className="select-wrapper">
                                            <select name="plc" value={formData.plc} onChange={handleChange}>
                                                <option value="front_facing">Front Facing</option>
                                                <option value="corner">Corner</option>
                                                <option value="park_facing">Park Facing</option>
                                                <option value="road_facing">Road Facing</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Projected Rent per sqft</label>
                                        <div className="input-with-suffix">
                                            <input
                                                type="number"
                                                value={rentPerSqft}
                                                onChange={(e) => setRentPerSqft(e.target.value)}
                                                placeholder="e.g. 50"
                                            />
                                            <span className="suffix">₹/sqft</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Projected Rent (Total)</label>
                                        <div className="input-with-suffix">
                                            <input
                                                type="text"
                                                name="projected_rent"
                                                value={formData.projected_rent}
                                                readOnly
                                                placeholder="Calculated automatically"
                                                style={{ backgroundColor: '#f9fafb' }}
                                                title={`Calculated based on ${projects.find(p => p.id === parseInt(formData.project_id))?.calculation_type || 'Super Area'}`}
                                            />
                                            <span className="suffix">INR/mo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Unit Images</label>
                                    <div className="upload-box dashed" onClick={handleUploadClick}>
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
                                            <span className="upload-hint">PNG, JPG up to 10MB</span>
                                        </div>
                                    </div>
                                    {images.length > 0 && <div style={{ marginTop: 5 }}>{images.length} files selected</div>}
                                </div>
                            </section>

                            {submitMessage && (
                                <div className="submit-message" style={{ marginBottom: '20px', padding: '10px', backgroundColor: submitMessage.includes('successfully') ? '#d4edda' : '#f8d7da', color: submitMessage.includes('successfully') ? '#155724' : '#721c24', borderRadius: '4px' }}>
                                    {submitMessage}
                                </div>
                            )}

                            <div className="form-footer">
                                <Link to="/admin/units" className="cancel-btn">Cancel</Link>
                                <button type="submit" className="create-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating...' : 'Create Unit'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddUnit;