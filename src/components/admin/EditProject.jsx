import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getProjectById, updateProject, getProjectLocations } from "../../services/api";
import { indianCities } from "../../utils/indianLocations";
import "./EditProject.css";

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    project_name: "",
    location: "",
    address: "",
    project_type: "",
    calculation_type: "",
    total_floors: "",
    total_project_area: "",
    description: "",
    status: "active"
  });

  const [image, setImage] = useState(null);
  const [locations, setLocations] = useState([]);

  // Fetch Locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await getProjectLocations();
        const fetched = response.data || [];
        const unique = [...new Set([...indianCities, ...fetched])].sort();
        setLocations(unique);
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        setLocations(indianCities);
      }
    };
    fetchLocations();
  }, []);

  // Fetch Project
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await getProjectById(id);
        const data = res.data.data || res.data;
        setFormData({
          project_name: data.project_name || "",
          location: data.location || "",
          address: data.address || "",
          project_type: data.project_type || "RETAIL/SHOP",
          calculation_type: data.calculation_type || "Super Area",
          total_floors: data.total_floors || "",
          total_project_area: data.total_project_area || "",
          description: data.description || "",
          status: data.status || "active"
        });
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };
    fetchProject();
  }, [id]);

  /* ================= HANDLERS ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [isOtherLocation, setIsOtherLocation] = useState(false);

  const handleLocationChange = (e) => {
    const val = e.target.value;
    if (val === "Other") {
      setIsOtherLocation(true);
      setFormData(prev => ({ ...prev, location: "" }));
    } else {
      setIsOtherLocation(false);
      setFormData(prev => ({ ...prev, location: val }));
    }
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const [submitMessage, setSubmitMessage] = useState('');

  const handleUpdate = async () => {
    setSubmitMessage('');
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (image) {
        data.append("image", image);
      }

      await updateProject(id, data);
      setSubmitMessage('Project Updated successfully');
      setTimeout(() => navigate("/admin/projects"), 2000);
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating project");
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="edit-project-container">
          <header className="edit-header">
            <div className="header-left">
              <div className="breadcrumb">
                <Link to="/admin/dashboard">HOME</Link> &gt;
                <Link to="/admin/projects">PROJECTS</Link> &gt;
                <span className="active">EDIT PROJECT</span>
              </div>
              <div className="title-row">
                <h1>{formData.project_name}</h1>
                <span className={`status-badge ${formData.status === 'active' ? 'active' : ''}`}>{formData.status}</span>
              </div>
              <p className="subtitle">Update critical project details.</p>
            </div>
          </header>

          <div className="edit-grid">
            {/* Main Column */}
            <div className="edit-col-main">
              <section className="edit-card">
                <h3>General Information</h3>
                <div className="form-group vertical">
                  <label>Project Name</label>
                  <input type="text" name="project_name" value={formData.project_name} onChange={handleChange} />
                </div>
                <div className="form-row">
                  <div className="form-group vertical">
                    <label>Location</label>
                    {!isOtherLocation ? (
                      <select
                        className="form-control" // Reuse existing styles if available or fallback
                        style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}
                        value={(locations.includes(formData.location) || formData.location === "") ? formData.location : "Other"}
                        onChange={handleLocationChange}
                      >
                        <option value="" disabled>Select Location</option>
                        {locations.map((loc, index) => (
                          <option key={index} value={loc}>{loc}</option>
                        ))}
                        <option value="Other">Other...</option>
                      </select>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Enter custom location"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setIsOtherLocation(false)}
                          style={{ padding: '0 10px', whiteSpace: 'nowrap', border: '1px solid #ccc', background: '#f1f1f1', cursor: 'pointer', borderRadius: '4px' }}
                        >
                          Back
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="form-group vertical">
                    <label>Project Type</label>
                    <select name="project_type" value={formData.project_type} onChange={handleChange}>
                      <option value="RETAIL/SHOP">RETAIL/SHOP</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Mixed Use">Mixed Use</option>
                    </select>
                  </div>
                </div>
                <div className="form-group vertical">
                  <label>Calculation Basis</label>
                  <select name="calculation_type" value={formData.calculation_type} onChange={handleChange}>
                    <option value="Super Area">Super Area</option>
                    <option value="Covered Area">Covered Area</option>
                    <option value="Carpet Area">Carpet Area</option>
                  </select>
                </div>
                <div className="form-group vertical">
                  <label>Address</label>
                  <textarea name="address" rows="3" value={formData.address} onChange={handleChange} />
                </div>
                <div className="form-group vertical">
                  <label>Description</label>
                  <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />
                </div>
              </section>
            </div>

            {/* Side Column */}
            <div className="edit-col-side">
              <section className="edit-card">
                <h3>Stats</h3>
                <div className="form-group vertical">
                  <label>Total Floors</label>
                  <input type="number" name="total_floors" value={formData.total_floors} onChange={handleChange} />
                </div>
                <div className="form-group vertical">
                  <label>Total Area (sqft)</label>
                  <input type="number" name="total_project_area" value={formData.total_project_area} onChange={handleChange} />
                </div>
              </section>

              <section className="edit-card">
                <h3>Settings</h3>
                <div className="toggle-row">
                  <span>Status</span>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="form-group vertical" style={{ marginTop: '15px' }}>
                  <label>Update Image</label>
                  <input type="file" onChange={handleImageChange} />
                </div>
              </section>
            </div>
          </div>

          {submitMessage && (
            <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px', fontWeight: '500' }}>
              {submitMessage}
            </div>
          )}

          <div className="edit-footer">
            <Link to="/admin/projects" className="cancel-btn">Cancel</Link>
            <button className="update-btn" onClick={handleUpdate}>Update Project</button>
          </div>
        </div >
      </main >
    </div >
  );
};

export default EditProject;
