const supabase = require("../config/db");
const bcrypt = require("bcryptjs");
const { handleDbError } = require('../utils/errorHandler');
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

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // 1. Check if user already exists in public.users
        const { data: existing } = await supabase.from('users').select('id').eq('email', email);
        if (existing && existing.length > 0) {
            return res.status(400).json({ message: "User with this email already exists in the system." });
        }

        // 2. Fetch Role ID correctly
        let roleId = null;
        const requestedRole = role_name || 'User';
        const { data: roleResult } = await supabase.from('roles').select('id').eq('role_name', requestedRole).single();

        if (roleResult) {
            roleId = roleResult.id;
        } else {
            // Fallback: try to find any default role if specified role name doesn't exist
            const { data: fallbackRole } = await supabase.from('roles')
                .select('id')
                .or(`role_name.ilike.User,role_name.ilike.Viewer`)
                .limit(1)
                .single();
            
            if (fallbackRole) roleId = fallbackRole.id;
            else {
                // Last resort fallback
                const { data: anyRole } = await supabase.from('roles').select('id').limit(1).single();
                if (anyRole) roleId = anyRole.id;
            }
        }

        // 3. Create User in Supabase Auth (admin-level bypasses confirmation)
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
            console.error("Supabase Admin Auth Error:", authError);
            return res.status(400).json({ success: false, message: `Authentication Error: ${authError.message}` });
        }

        // 4. Hash password for local storage (redundant if using Auth only, but schema has it)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Insert into public.users
        const { data: result, error: insertError } = await supabase.from('users').insert({
            first_name: first_name || '', 
            last_name: last_name || '', 
            email, 
            password_hash: hashedPassword, 
            role_id: roleId, 
            status: 'active'
        }).select('id').single();

        if (insertError) {
            console.error("Public Profile Create Error:", insertError);
            // If this fails, we have an orphaned auth user, but better to report the error
            throw insertError;
        }

        const performingUser = req.user ? (req.user.id || req.user.email) : 'System Admin';
        await logActivity(performingUser, "Created User", "User Management", `User ${first_name} ${last_name} (${email}) created with role ${requestedRole}`);

        res.status(201).json({ 
            success: true,
            message: "User created successfully", 
            id: result.id 
        });
    } catch (error) {
        console.error("Create user catch error:", error);
        res.status(500).json({ 
            message: error.message || "An unexpected error occurred during user creation", 
            error: error.message 
        });
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
