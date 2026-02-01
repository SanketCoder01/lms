const pool = require("../config/db");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotification } = require('../utils/notificationHelper');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

/* ================= ADD PROJECT ================= */
const addProject = async (req, res) => {
  try {
    const {
      project_name,
      location,
      address,
      project_type,
      calculation_type,
      total_floors,
      total_project_area,
      description
    } = req.body;

    const image = req.file ? req.file.filename : null;

    // Sanitize numeric fields
    const floors = total_floors ? parseInt(total_floors) : 0;
    const area = total_project_area ? parseFloat(total_project_area) : 0;

    const values = [
      project_name,
      location || null,
      address || null,
      project_type || null,
      calculation_type || 'Super Area',
      floors,
      area,
      image,
      description || null
    ];

    console.log("DEBUG ADD PROJECT VALUES:", values);

    const [result] = await pool.execute(
      `INSERT INTO projects 
      (project_name, location, address, project_type, calculation_type, total_floors, total_project_area, project_image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      values
    );

    // Notify
    await createNotification(1, "New Project Added", `Project "${project_name}" has been created in ${location}.`, "success");

    res.status(201).json({ message: "Project Added Successfully", id: result.insertId });
  } catch (error) {
    console.error("Add project error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET ALL PROJECTS ================= */
/* ================= GET ALL PROJECTS ================= */
const getProjects = async (req, res) => {
  try {
    const { search, location, type, status } = req.query;
    let query = "SELECT * FROM projects";
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push("(project_name LIKE ? OR location LIKE ? OR id LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (location && location !== 'All') {
      conditions.push("location = ?");
      params.push(location);
    }

    if (type && type !== 'All') {
      conditions.push("project_type = ?");
      params.push(type);
    }

    if (status && status !== 'All') {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC";

    // Using promise-based execute() method
    const [projects] = await pool.execute(query, params);
    res.json({ data: projects }); // Wrapped in data to match frontend expectation in some places or standardized
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT LOCATIONS ================= */
const getProjectLocations = async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT DISTINCT location FROM projects WHERE location IS NOT NULL AND location != '' ORDER BY location ASC");
    const locations = rows.map(row => row.location);
    res.json(locations);
  } catch (error) {
    console.error("Get project locations error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT BY ID ================= */
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch project details with stats
    const query = `
            SELECT 
                p.*,
                COUNT(u.id) AS total_units,
                SUM(CASE WHEN u.status = 'occupied' THEN 1 ELSE 0 END) AS occupied_units,
                SUM(CASE WHEN u.status = 'vacant' THEN 1 ELSE 0 END) AS vacant_units,
                COALESCE(SUM(u.super_area), 0) AS total_area,
                COALESCE(SUM(CASE WHEN u.status = 'occupied' THEN u.super_area ELSE 0 END), 0) AS leased_area
            FROM projects p
            LEFT JOIN units u ON p.id = u.project_id
            WHERE p.id = ?
            GROUP BY p.id
        `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE PROJECT ================= */
const updateProject = async (req, res) => {
  try {
    const {
      project_name,
      location,
      address,
      project_type,
      total_floors,
      total_project_area,
      description,
      status
    } = req.body;

    const image = req.file ? req.file.filename : null;

    // Sanitize numeric fields
    const floors = total_floors ? parseInt(total_floors) : 0;
    const area = total_project_area ? parseFloat(total_project_area) : 0;

    let sql = `
      UPDATE projects SET
      project_name=?, location=?, address=?, project_type=?, calculation_type=?,
      total_floors=?, total_project_area=?, description=?, status=?
    `;
    const values = [
      project_name,
      location || null,
      address || null,
      project_type || null,
      calculation_type || 'Super Area',
      floors,
      area,
      description || null,
      status || 'active'
    ];

    if (image) {
      sql += ", project_image=?";
      values.push(image);
    }

    sql += " WHERE id=?";
    values.push(req.params.id);

    await pool.execute(sql, values);
    res.json({ message: "Project Updated Successfully" });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ error: error.message });
  }
};

/* ================= DELETE PROJECT ================= */
const deleteProject = async (req, res) => {
  try {
    await pool.execute("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "Project Deleted Successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    if (error.errno === 1451) {
      return res.status(400).json({ error: "Cannot delete project. It has associated units or leases. Please delete them first." });
    }
    res.status(500).json({ error: error.message });
  }
};

/* ================= GET PROJECT UNITS ================= */
const getUnitsByProject = async (req, res) => {
  try {
    const { id } = req.params;
    const [units] = await pool.execute(`
      SELECT 
        u.id, 
        u.unit_number, 
        u.floor_number, 
        u.super_area, 
        u.status 
      FROM units u
      WHERE u.project_id = ?
      ORDER BY u.unit_number ASC
    `, [id]);

    res.json({ data: units });
  } catch (error) {
    console.error("Get units by project error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addProject,
  getProjects,
  getProjectById,
  getProjectLocations,
  updateProject,
  deleteProject,
  getUnitsByProject,
  upload,
  getDashboardStats: async (req, res) => {
    try {
      // 1. Pending Projects (projects in draft/pending)
      const [pendingProjects] = await pool.execute(
        "SELECT COUNT(*) as count FROM projects WHERE status IN ('draft', 'pending_approval')"
      );

      // 2. Pending Approvals (leases in draft/pending)
      const [pendingApprovals] = await pool.execute(
        "SELECT COUNT(*) as count FROM leases WHERE status IN ('draft', 'pending_approval')"
      );

      // 3. Approved Today (leases approved/active today)
      // Note: Using created_at because updated_at column does not exist in schema
      const [approvedToday] = await pool.execute(
        "SELECT COUNT(*) as count FROM leases WHERE status IN ('approved', 'active') AND DATE(created_at) = CURDATE()"
      );

      // 4. Rejected Today (leases rejected today)
      const [rejectedToday] = await pool.execute(
        "SELECT COUNT(*) as count FROM leases WHERE status = 'rejected' AND DATE(created_at) = CURDATE()"
      );

      res.json({
        pendingProjects: pendingProjects[0].count,
        pendingApprovals: pendingApprovals[0].count,
        approvedToday: approvedToday[0].count,
        rejectedToday: rejectedToday[0].count
      });
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ error: error.message });
    }
  }
};
