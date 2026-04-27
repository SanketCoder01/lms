const express = require("express");
const router = express.Router();
const supabase = require("../config/db");

/* ===============================
   GET ALL ROLES
================================ */
router.get("/", async (req, res) => {
    try {
        // Fetch all available roles
        const { data: roles, error } = await supabase
            .from('roles')
            .select('id, name, role_name')
            .order('name', { ascending: true });

        if (error) {
            // If roles table doesn't exist, return default roles
            console.log('Roles table error, returning defaults:', error.message);
            return res.json({ 
                success: true, 
                data: [
                    { id: 1, name: 'Admin', role_name: 'Admin' },
                    { id: 2, name: 'User', role_name: 'User' },
                    { id: 3, name: 'Manager', role_name: 'Manager' },
                    { id: 4, name: 'Super Admin', role_name: 'Super Admin' }
                ] 
            });
        }

        // Format response
        const formattedRoles = (roles || []).map(r => ({
            id: r.id,
            name: r.name || r.role_name,
            role_name: r.role_name || r.name
        }));

        res.json({ success: true, data: formattedRoles });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

/* ===============================
   GET ALL USERS WITH ROLE + MODULES
================================ */
router.get("/users", async (req, res) => {
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
                roles:roles_id (
                    id,
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