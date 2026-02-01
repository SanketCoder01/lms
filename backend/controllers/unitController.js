const pool = require("../config/db");

/* ================= GET UNITS ================= */
/* ================= GET UNITS ================= */
const getUnits = async (req, res) => {
    try {
        const { projectId, search, status } = req.query;
        let query = `
            SELECT 
                u.id,
                u.unit_number,
                p.project_name AS building,
                u.super_area,
                u.status,
                u.project_id,
                (SELECT owner_id FROM owner_units WHERE unit_id = u.id LIMIT 1) as owner_id
            FROM units u
            JOIN projects p ON p.id = u.project_id
            WHERE 1=1
        `;
        const params = [];

        if (projectId && projectId !== 'All') {
            query += " AND u.project_id = ?";
            params.push(projectId);
        }

        if (status && status !== 'All') {
            query += " AND u.status = ?";
            params.push(status);
        }

        if (search) {
            query += " AND (u.unit_number LIKE ? OR p.project_name LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        query += " ORDER BY u.id DESC";

        const [rows] = await pool.query(query, params);

        res.json({ data: rows });
    } catch (err) {
        console.error("Fetch units error:", err);
        res.status(500).json({ message: "Failed to fetch units" });
    }
};

/* ================= CREATE UNIT ================= */
const createUnit = async (req, res) => {
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        const {
            project_id,
            unit_number,
            floor_number,
            block_tower,
            super_area,
            carpet_area,
            covered_area,
            builtup_area,
            unit_condition,
            plc,
            projected_rent
        } = req.body;

        /* --------- VALIDATION --------- */
        if (!project_id || !unit_number) {
            return res.status(400).json({
                message: "project_id and unit_number are required"
            });
        }

        /* --------- INSERT UNIT --------- */
        const [result] = await conn.query(
            `
            INSERT INTO units (
                project_id,
                unit_number,
                floor_number,
                block_tower,
                super_area,
                carpet_area,
                covered_area,
                builtup_area,
                unit_condition,
                plc,
                projected_rent,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'vacant')
            `,
            [
                project_id,
                unit_number,
                floor_number || null,
                block_tower || null,
                super_area || null,
                carpet_area || null,
                covered_area || null,
                builtup_area || null,
                unit_condition || 'bare_shell',
                plc || null,
                projected_rent || null
            ]
        );

        const unitId = result.insertId;

        /* --------- INSERT IMAGES --------- */
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            for (const file of req.files) {
                await conn.query(
                    `INSERT INTO unit_images (unit_id, image_path)
                     VALUES (?, ?)`,
                    [unitId, file.filename]
                );
            }
        }

        /* --------- UPDATE PROJECT TOTAL AREA --------- */
        await conn.query(
            `UPDATE projects 
             SET total_project_area = (
                SELECT COALESCE(SUM(super_area), 0) 
                FROM units 
                WHERE project_id = ?
             ) 
             WHERE id = ?`,
            [project_id, project_id]
        );

        await conn.commit();

        res.status(201).json({
            message: "Unit created successfully",
            unit_id: unitId
        });

    } catch (err) {
        await conn.rollback();
        console.error("Create unit error:", err);
        res.status(500).json({ message: "Failed to create unit" });
    } finally {
        conn.release();
    }
};

/* ================= UPDATE UNIT ================= */
const updateUnit = async (req, res) => {
    const { id } = req.params;
    const {
        unit_number,
        floor_number,
        block_tower,
        super_area,
        carpet_area,
        unit_condition,
        plc,
        projected_rent,
        status
    } = req.body;

    try {
        const [result] = await pool.query(
            `
            UPDATE units 
            SET 
                unit_number = ?, 
                floor_number = ?, 
                block_tower = ?,
                super_area = ?, 
                carpet_area = ?, 
                unit_condition = ?, 
                plc = ?, 
                projected_rent = ?, 
                status = ?
            WHERE id = ?
            `,
            [
                unit_number,
                floor_number || null,
                block_tower || null,
                super_area || null,
                carpet_area || null,
                unit_condition || 'bare_shell',
                plc || null,
                projected_rent || null,
                status || 'vacant',
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Unit not found" });
        }

        /* --------- UPDATE PROJECT TOTAL AREA --------- */
        // Get project_id for this unit
        const [unitRows] = await pool.query("SELECT project_id FROM units WHERE id = ?", [id]);
        if (unitRows.length > 0) {
            const projectId = unitRows[0].project_id;
            await pool.query(
                `UPDATE projects 
                 SET total_project_area = (
                    SELECT COALESCE(SUM(super_area), 0) 
                    FROM units 
                    WHERE project_id = ?
                 ) 
                 WHERE id = ?`,
                [projectId, projectId]
            );
        }

        res.json({ message: "Unit updated successfully" });
    } catch (err) {
        console.error("Update unit error:", err);
        res.status(500).json({ message: "Failed to update unit" });
    }
};

/* ================= GET UNIT BY ID ================= */
const getUnitById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `
            SELECT 
                u.id,
                u.unit_number,
                u.floor_number,
                u.block_tower,
                u.super_area,
                u.carpet_area,
                u.covered_area,
                u.builtup_area,
                u.unit_condition,
                u.plc,
                u.projected_rent,
                u.status,
                p.project_name,
                p.id as project_id,
                (SELECT image_path FROM unit_images WHERE unit_id = u.id LIMIT 1) as unit_image
            FROM units u
            JOIN projects p ON p.id = u.project_id
            WHERE u.id = ?
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Unit not found" });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error("Fetch unit by ID error:", err);
        res.status(500).json({ message: "Failed to fetch unit" });
    }
};

/* ================= DELETE UNIT ================= */
const deleteUnit = async (req, res) => {
    try {
        const { id } = req.params;

        // Get project_id before deletion
        const [unitRows] = await pool.query("SELECT project_id FROM units WHERE id = ?", [id]);

        await pool.query("DELETE FROM units WHERE id = ?", [id]);

        if (unitRows.length > 0) {
            const projectId = unitRows[0].project_id;
            // Update project total area
            await pool.query(
                `UPDATE projects 
                 SET total_project_area = (
                    SELECT COALESCE(SUM(super_area), 0) 
                    FROM units 
                    WHERE project_id = ?
                 ) 
                 WHERE id = ?`,
                [projectId, projectId]
            );
        }

        res.json({ message: "Unit Deleted Successfully" });
    } catch (error) {
        console.error("Delete unit error:", error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getUnits,
    createUnit,
    updateUnit,
    getUnitById,
    deleteUnit
};
