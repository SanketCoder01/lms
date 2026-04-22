import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { unitAPI, getProjects, filterAPI, structureAPI, handleApiError } from '../../services/api';
import usePermissions from '../../hooks/usePermissions';
import './AddUnit.css';

const AddUnit = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const { can, isProjectUser, projectId: assignedProjectId, hasProjectAccess } = usePermissions();
    // const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [unitConditions, setUnitConditions] = useState([
        { value: 'fully_fitted', label: 'Fully Fitted' }
    ]);
    const [plcs, setPlcs] = useState([
        { value: 'front_facing', label: 'Front Facing' }
    ]);
    const [blocks, setBlocks] = useState([]);
    const [floors, setFloors] = useState([]);
    const [unitCategories, setUnitCategories] = useState([]);
    const [unitZoningTypes, setUnitZoningTypes] = useState([]);

    // Get projectId from URL params if available
    const queryParams = new URLSearchParams(location.search);
    const preSelectedProjectId = queryParams.get('projectId') || '';

    // For project users, always use their assigned project
    const effectiveProjectId = isProjectUser ? assignedProjectId : preSelectedProjectId;

    const [formData, setFormData] = useState({
        project_id: effectiveProjectId,
        unit_number: '',
        floor_number: '',
        block_tower: '',
        chargeable_area: '',
        carpet_area: '',
        covered_area: '',
        unit_condition: 'fully_fitted',
        plc: 'front_facing',
        unit_category: '',
        unit_zoning_type: '',
        projected_rent: ''
    });

    const [images, setImages] = useState([]);
    const [submitMessage, setSubmitMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Check if user has permission to add units
        if (!can('edit')) {
            setSubmitMessage('You do not have permission to add units.');
            return;
        }

        const fetchProjects = async () => {
            try {
                const res = await getProjects(isProjectUser ? { projectId: assignedProjectId } : {});
                let projectData = res.data.data || res.data;

                // Filter for project users
                if (isProjectUser) {
                    projectData = projectData.filter(p => hasProjectAccess(p.id));
                }

                setProjects(projectData);
            } catch (err) {
                console.error("Failed to fetch projects", err);
            }
        };
        const fetchFilters = async () => {
            try {
                const ucRes = await filterAPI.getFilterOptions("unit_condition");
                if (ucRes.data.data.length > 0) {
                    setUnitConditions(ucRes.data.data.map(t => ({ value: t.option_value, label: t.option_value })));
                } else {
                    setUnitConditions([
                        { value: 'vacant', label: 'Vacant' },
                        { value: 'maintenance', label: 'Maintenance' }
                    ]);
                }
                const plcRes = await filterAPI.getFilterOptions("plc");
                if (plcRes.data.data.length > 0) {
                    setPlcs(plcRes.data.data.map(t => ({ value: t.option_value, label: t.option_value })));
                } else {
                    setPlcs([
                        { value: 'none', label: 'None' }
                    ]);
                }

                // Floor and Block fetching handled by project selection effect
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
        fetchProjects();
        fetchFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load blocks and floors when project changes
    useEffect(() => {
        if (!formData.project_id) {
            setBlocks([]);
            setFloors([]);
            return;
        }
        const loadStructure = async () => {
            try {
                const bRes = await structureAPI.getBlocks(formData.project_id);
                setBlocks((bRes.data?.data || []).map(b => b.block_name));
                const fRes = await structureAPI.getFloors({ project_id: formData.project_id });
                // If block is selected, filter floors by it? Wait, API can do that if we passed block_id, but here let's just get all project floors. Actually floor_name is what we need.
                setFloors((fRes.data?.data || []).map(f => f.floor_name));
            } catch (err) {
                console.error("Failed to load unit structure", err);
            }
        };
        loadStructure();
    }, [formData.project_id]);

    // State for the unit input suffix (e.g., "101")
    const [unitSuffix, setUnitSuffix] = useState('');
    const [rentPerSqft, setRentPerSqft] = useState('');

    // State for validation errors
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Find selected project to get calculation basis
        const selectedProject = projects.find(p => p.id === parseInt(formData.project_id));
        const calcType = selectedProject?.calculation_type || 'Chargeable Area';

        let area = 0;
        if (calcType === 'Covered Area') {
            area = parseFloat(formData.covered_area) || 0;
        } else if (calcType === 'Carpet Area') {
            area = parseFloat(formData.carpet_area) || 0;
        } else {
            area = parseFloat(formData.chargeable_area) || 0;
        }

        const rate = parseFloat(rentPerSqft) || 0;
        const total = area * rate;

        setFormData(prev => ({
            ...prev,
            projected_rent: total > 0 ? total.toString() : ''
        }));
    }, [formData.chargeable_area, formData.covered_area, formData.carpet_area, formData.project_id, rentPerSqft, projects]);

    // Validation Effect
    useEffect(() => {
        const superArea = parseFloat(formData.chargeable_area) || 0;
        const coveredArea = parseFloat(formData.covered_area) || 0;
        const carpetArea = parseFloat(formData.carpet_area) || 0;

        const newErrors = {};

        if (formData.covered_area && superArea > 0 && coveredArea >= superArea) {
            newErrors.covered_area = "Must be less than Chargeable Area";
        }

        if (formData.carpet_area && coveredArea > 0 && carpetArea >= coveredArea) {
            newErrors.carpet_area = "Must be less than Covered Area";
        } else if (formData.carpet_area && superArea > 0 && carpetArea >= superArea) {
            // Fallback if covered area is missing but super area exists
            newErrors.carpet_area = "Must be less than Chargeable Area";
        }

        setErrors(newErrors);
    }, [formData.chargeable_area, formData.covered_area, formData.carpet_area]);

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

        // Permission check
        if (!can('edit')) {
            setSubmitMessage('You do not have permission to add units.');
            return;
        }

        // Project user check
        if (isProjectUser && !hasProjectAccess(formData.project_id)) {
            setSubmitMessage('You can only add units to your assigned project.');
            return;
        }

        setIsSubmitting(true);
        setSubmitMessage('');

        if (!formData.project_id) {
            setSubmitMessage("Please select a project.");
            setIsSubmitting(false);
            return;
        }

        if (!formData.chargeable_area && !formData.carpet_area && !formData.covered_area) {
            setSubmitMessage("At least ONE area (Chargeable, Covered, or Carpet) is mandatory.");
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
            setSubmitMessage('Failed to create unit. ' + handleApiError(error));
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
                                                placeholder="e.g. A, B, Tower 1"
                                            />
                                        )}
                                    </div>
                                    <div className="form-group">
                                        <label>Floor Number</label>
                                        {floors.length > 0 ? (
                                            <div className="select-wrapper">
                                                <select
                                                    name="floor_number"
                                                    value={formData.floor_number}
                                                    onChange={handleFloorChange}
                                                    required
                                                >
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
                                                onChange={handleFloorChange}
                                                placeholder="e.g. GF, 1F"
                                                required
                                            />
                                        )}
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
                                        <label>Chargeable Area (sq ft)</label>
                                        <input
                                            type="number"
                                            name="chargeable_area"
                                            value={formData.chargeable_area}
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
                                        {formData.covered_area && formData.chargeable_area && (
                                            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                                                Loading Output (% Loading): {((parseFloat(formData.covered_area) / parseFloat(formData.chargeable_area)) * 100).toFixed(1)}%
                                            </span>
                                        )}
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
                                        {formData.carpet_area && formData.chargeable_area && (
                                            <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginTop: '4px' }}>
                                                Efficiency (% Carpet): {((parseFloat(formData.carpet_area) / parseFloat(formData.chargeable_area)) * 100).toFixed(1)}%
                                            </span>
                                        )}
                                        {errors.carpet_area && <span style={{ color: 'red', fontSize: '12px' }}>{errors.carpet_area}</span>}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Unit Condition</label>
                                        <div className="select-wrapper">
                                            <select name="unit_condition" value={formData.unit_condition} onChange={handleChange}>
                                                {unitConditions.map(uc => (
                                                    <option key={uc.value} value={uc.value}>{uc.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Unit Category</label>
                                        <div className="select-wrapper">
                                            <select name="unit_category" value={formData.unit_category} onChange={handleChange}>
                                                <option value="">Select Category</option>
                                                {unitCategories.map(uc => (
                                                    <option key={uc.value} value={uc.value}>{uc.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Unit Zoning Type</label>
                                        <div className="select-wrapper">
                                            <select name="unit_zoning_type" value={formData.unit_zoning_type} onChange={handleChange}>
                                                <option value="">Select Zoning</option>
                                                {unitZoningTypes.map(uc => (
                                                    <option key={uc.value} value={uc.value}>{uc.label}</option>
                                                ))}
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
                                        <label>Premium on Lease</label>
                                        <div className="select-wrapper">
                                            <select name="plc" value={formData.plc} onChange={handleChange}>
                                                <option value="">Select Premium On Lease (Optional)</option>
                                                {plcs.map(plc => (
                                                    <option key={plc.value} value={plc.value}>{plc.label}</option>
                                                ))}
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
                                                title={`Calculated based on ${projects.find(p => p.id === parseInt(formData.project_id))?.calculation_type || 'Chargeable Area'}`}
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
                                    {images.length > 0 && (
                                        <div style={{ marginTop: 15, display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {images.map((img, index) => (
                                                <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
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