import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { addProject, filterAPI, handleApiError } from "../../services/api";
import { indianStates, getCitiesByState } from "../../utils/indianLocations";
import "./AddProject.css";

const AddProject = () => {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [formData, setFormData] = useState({
    project_name: "",
    state: "",
    location: "",       // city
    address: "",
    project_type: "",
    calculation_type: "Chargeable Area",
    total_floors: "",
    total_project_area: "",
    description: "",
  });

  const [cities, setCities] = useState([]);
  const [types, setTypes] = useState(["RETAIL/SHOP", "Commercial", "Industrial", "Mixed Use"]);
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  /* ================= FETCH PROJECT TYPES ================= */
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await filterAPI.getFilterOptions("project_type");
        const apiTypes = response.data.data.map(t => t.option_value);
        if (apiTypes.length > 0) setTypes(apiTypes);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };
    fetchTypes();
  }, []);

  /* ================= UPDATE CITIES WHEN STATE CHANGES ================= */
  useEffect(() => {
    if (formData.state) {
      const stateCities = getCitiesByState(formData.state);
      setCities(stateCities);
      // Reset city if state changes
      setFormData(prev => ({ ...prev, location: "" }));
    } else {
      setCities([]);
    }
  }, [formData.state]);

  /* ================= HANDLE INPUT CHANGE ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  /* ================= HANDLE IMAGE ================= */
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    let errors = {};
    if (!formData.project_name) errors.project_name = "🚨 Please fill this section to proceed";
    if (!formData.project_type) errors.project_type = "🚨 Please fill this section to proceed";
    if (!formData.calculation_type) errors.calculation_type = "🚨 Please fill this section to proceed";
    if (!formData.state) errors.state = "🚨 Please fill this section to proceed";
    if (!formData.location) errors.location = "🚨 Please fill this section to proceed";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setSubmitMessage('');
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (image) data.append("image", image);

      await addProject(data);
      setSubmitMessage('Project created successfully');
      setTimeout(() => navigate("/admin/projects"), 2000);
    } catch (error) {
      console.error("Add project error:", error);
      const errorMessage = handleApiError(error);
      alert(`Failed to add project: ${errorMessage}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <div className="add-project-container">
          <div className="project-form-card">

            {/* HEADER */}
            <div className="form-header">
              <div className="header-titles">
                <h2>Add New Project</h2>
                <p>Enter the details for the new lease project.</p>
              </div>
              <Link to="/admin/projects" className="close-btn">✕</Link>
            </div>

            {/* FORM */}
            <form className="project-form" onSubmit={handleSubmit} noValidate>

              <div className="form-row">
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    name="project_name"
                    value={formData.project_name}
                    onChange={handleChange}
                    placeholder="e.g. Nexus Mall Phase 2"
                    className={validationErrors.project_name ? 'input-error' : ''}
                    required
                  />
                  {validationErrors.project_name && <span className="error-text">{validationErrors.project_name}</span>}
                </div>

                <div className="form-group">
                  <label>Project Type *</label>
                  <select
                    name="project_type"
                    value={formData.project_type}
                    onChange={handleChange}
                    className={validationErrors.project_type ? 'input-error' : ''}
                    required
                  >
                    <option value="">Select Type</option>
                    {types.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {validationErrors.project_type && <span className="error-text">{validationErrors.project_type}</span>}
                </div>
              </div>

              {/* State + City ROW */}
              <div className="form-row">
                <div className="form-group">
                  <label>State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className={validationErrors.state ? 'input-error' : ''}
                    required
                  >
                    <option value="">-- Select State --</option>
                    {indianStates.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {validationErrors.state && <span className="error-text">{validationErrors.state}</span>}
                </div>

                <div className="form-group">
                  <label>City *</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={validationErrors.location ? 'input-error' : ''}
                    required
                    disabled={!formData.state}
                  >
                    <option value="">{formData.state ? '-- Select City --' : '-- Select State First --'}</option>
                    {cities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {validationErrors.location && <span className="error-text">{validationErrors.location}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Full property address"
                  />
                </div>
              </div>

              <div className="form-row three-cols">
                <div className="form-group">
                  <label>Calculation Basis</label>
                  {validationErrors.calculation_type && <span className="error-text" style={{display: 'block', marginBottom: '8px'}}>{validationErrors.calculation_type}</span>}
                  <div className={`checkbox-group ${validationErrors.calculation_type ? 'input-error' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px', padding: validationErrors.calculation_type ? '8px' : '0' }}>
                    {["Chargeable Area", "Covered Area", "Carpet Area"].map((type) => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={formData.calculation_type.includes(type)}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setFormData(prev => {
                              let currentTypes = prev.calculation_type ? prev.calculation_type.split(',').filter(x => x) : [];
                              if (checked) {
                                if (!currentTypes.includes(type)) currentTypes.push(type);
                              } else {
                                currentTypes = currentTypes.filter(t => t !== type);
                              }
                              return { ...prev, calculation_type: currentTypes.join(',') };
                            });
                          }}
                          style={{ marginRight: '8px', width: 'auto' }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>Total Floors</label>
                  <input
                    type="number"
                    name="total_floors"
                    value={formData.total_floors}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Total Project Area</label>
                  <input
                    type="text"
                    name="total_project_area"
                    value={formData.total_project_area}
                    onChange={handleChange}
                    placeholder="sqft"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows="4"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="upload-section">
                <label>Project Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  {image && (
                    <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                      <img src={URL.createObjectURL(image)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
              </div>

              {submitMessage && (
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
                  {submitMessage}
                </div>
              )}

              <div className="form-footer">
                <button
                  type="submit"
                  className="create-btn"
                  disabled={isSubmitting}
                  style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? '+ Creating...' : '+ Create Project'}
                </button>
              </div>

            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddProject;
