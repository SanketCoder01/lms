const express = require("express");
const router = express.Router();
const supabase = require("../config/db");

/* ===============================
   GET ALL USERS WITH ROLE + MODULES
================================ */
router.get("/", async (req, res) => {
    try {
        // Fetch users with their roles
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id,
                first_name,
                last_name,
                email,
                status,
                role_id,
                roles:id (
                    name
                )
            `);

        if (error) throw error;

        // Format response
        const formattedUsers = (users || []).map(u => ({
            id: u.id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            status: u.status,
            role: u.roles?.name || 'No Role',
            modules: []
        }));

        res.json(formattedUsers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

/* ===============================
   CREATE NEW USER
================================ */
router.post("/", async (req, res) => {
    const { first_name, last_name, email, phone, password_hash, role_id, status } = req.body;

    try {
        const { data, error } = await supabase
            .from('users')
            .insert({
                first_name,
                last_name,
                email,
                phone,
                password_hash: password_hash || 'SUPABASE_AUTH',
                role_id,
                status: status || 'active'
            })
            .select('id')
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, message: "User created successfully", userId: data.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Creation failed", error: err.message });
    }
});

/* ===============================
   UPDATE USER ROLE + STATUS
================================ */
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { role_id, status } = req.body;

    try {
        const { error } = await supabase
            .from('users')
            .update({ role_id, status })
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: "User updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Update failed", error: err.message });
    }
});

/* ===============================
   DELETE USER
================================ */
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Delete failed", error: err.message });
    }
});

module.exports = router;