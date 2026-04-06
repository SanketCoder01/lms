const supabase = require("../config/db");
const bcrypt = require("bcryptjs");
// The logger utils wasn't updated yet to use supabase, but I'll assume we either bypass it or comment it out for now,
// or we rewrite it later. Let's keep the call structure the same, but wait, `logActivity` is in `utils/logger.js`.
const { logActivity } = require("../utils/logger");

/* ================= GET ALL USERS ================= */
const getUsers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = supabase.from('users').select(`
            id, first_name, last_name, email, status, created_at,
            roles(role_name)
        `).order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data.map(u => ({
            id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email,
            status: u.status, created_at: u.created_at, role_name: u.roles?.role_name
        }));

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(u => 
                (u.first_name && u.first_name.toLowerCase().includes(s)) ||
                (u.last_name && u.last_name.toLowerCase().includes(s)) ||
                (u.email && u.email.toLowerCase().includes(s))
            );
        }

        res.json(filtered);
    } catch (error) {
        console.error("Get users error:", error);
        res.status(500).json({ error: error.message });
    }
};

/* ================= CREATE USER (ADMIN) ================= */
const createUser = async (req, res) => {
    try {
        const { first_name, last_name, email, password, role_name } = req.body;

        const { data: existing } = await supabase.from('users').select('id').eq('email', email);
        if (existing && existing.length > 0) return res.status(400).json({ message: "User already exists" });

        let roleId = null;
        const requestedRole = role_name || 'User';
        const { data: roleResult } = await supabase.from('roles').select('id').eq('role_name', requestedRole).single();

        if (roleResult) roleId = roleResult.id;
        else {
            const { data: anyRole } = await supabase.from('roles').select('id').limit(1).single();
            if (anyRole) roleId = anyRole.id;
        }

        // 1. Create User in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                first_name: first_name || '',
                last_name: last_name || '',
                role: requestedRole
            }
        });

        if (authError) {
            return res.status(400).json({ message: authError.message });
        }

        // 2. Hash password placeholder (Supabase manages the real password)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert into public.users
        const { data: result, error } = await supabase.from('users').insert({
            first_name: first_name || '', 
            last_name: last_name || '', 
            email, 
            password_hash: hashedPassword, 
            role_id: roleId, 
            status: 'active'
        }).select('id').single();

        if (error) throw error;

        const performingUser = req.user ? req.user.id : null;
        await logActivity(performingUser, "Created User", "User Management", `Created user ${first_name} ${last_name} (${email})`);

        res.status(201).json({ message: "User created successfully", id: result.id });
    } catch (error) {
        console.error("Create user error:", error);
        res.status(500).json({ message: error.message, error: error.message });
    }
};

/* ================= UPDATE USER ================= */
const updateUser = async (req, res) => {
    try {
        const { first_name, last_name, email, role_name, status, password } = req.body;

        let roleId = null;
        if (role_name) {
            const { data: roleResult } = await supabase.from('roles').select('id').eq('role_name', role_name).single();
            if (roleResult) roleId = roleResult.id;
        }

        let updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (email !== undefined) updateData.email = email;
        if (status !== undefined) updateData.status = status;
        if (roleId !== null) updateData.role_id = roleId;

        if (password && password.trim() !== "") {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }

        const { error } = await supabase.from('users').update(updateData).eq('id', req.params.id);
        if (error) throw error;

        const performingUser = req.user ? req.user.id : null;
        await logActivity(performingUser, "Updated User", "User Management", `Updated user ID ${req.params.id}`);

        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ error: error.message });
    }
};

/* ================= DELETE USER ================= */
const deleteUser = async (req, res) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', req.params.id);
        if (error) throw error;

        const performingUser = req.user ? req.user.id : null;
        await logActivity(performingUser, "Deleted User", "User Management", `Deleted user ID ${req.params.id}`);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
};
