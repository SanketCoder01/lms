const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

/* ===============================
   MULTER CONFIG (SAFE)
================================ */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error("Only images allowed"));
};

const upload = multer({ storage, fileFilter });

/* ===============================
   GET CURRENT USER PROFILE (Default)
================================ */
router.get("/", async (req, res) => {
    const id = 1;
    try {
        let { data, error } = await supabase.from('users').select('id, first_name, last_name, email, phone, job_title, location, profile_image').eq('id', id).single();
        
        if (error || !data) {
            const { data: fallback, error: fbErr } = await supabase.from('users').select('*').limit(1).single();
            if (fbErr || !fallback) return res.status(404).json({ message: "User not found" });
            data = fallback;
        }

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ===============================
   UPDATE CURRENT PROFILE (Default)
================================ */
router.put("/", async (req, res) => {
    const id = 1; 
    const { first_name, last_name, phone, job_title, location } = req.body;

    try {
        let updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone !== undefined) updateData.phone = phone;
        if (job_title !== undefined) updateData.job_title = job_title;
        if (location !== undefined) updateData.location = location;

        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No fields to update" });

        const { error } = await supabase.from('users').update(updateData).eq('id', id);
        if (error) throw error;

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
});

/* ===============================
   GET USER PROFILE BY ID
================================ */
router.get("/:id", async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('id, first_name, last_name, email, phone, job_title, location, profile_image').eq('id', req.params.id).single();
        
        if (error || !data) return res.status(404).json({ message: "User not found" });
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

/* ===============================
   UPDATE PROFILE BY ID
================================ */
router.put("/:id", async (req, res) => {
    const { first_name, last_name, phone, job_title, location } = req.body;

    try {
        let updateData = {};
        if (first_name !== undefined) updateData.first_name = first_name;
        if (last_name !== undefined) updateData.last_name = last_name;
        if (phone !== undefined) updateData.phone = phone;
        if (job_title !== undefined) updateData.job_title = job_title;
        if (location !== undefined) updateData.location = location;

        if (Object.keys(updateData).length === 0) return res.status(400).json({ message: "No fields to update" });

        const { error } = await supabase.from('users').update(updateData).eq('id', req.params.id);
        if (error) throw error;

        res.json({ message: "Profile updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Update failed" });
    }
});

/* ===============================
   UPLOAD PROFILE PHOTO
================================ */
router.post("/:id/photo", upload.single("photo"), async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;

    try {
        const { error } = await supabase.from('users').update({ profile_image: imagePath }).eq('id', req.params.id);
        if (error) throw error;

        res.json({ image: imagePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Photo upload failed" });
    }
});

/* ===============================
   REMOVE PROFILE PHOTO
================================ */
router.delete("/:id/photo", async (req, res) => {
    try {
        const { data, error } = await supabase.from('users').select('profile_image').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ message: "User not found" });

        const imagePath = data.profile_image;

        if (imagePath) {
            const fullPath = path.join(__dirname, "..", imagePath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        }

        const { error: updErr } = await supabase.from('users').update({ profile_image: null }).eq('id', req.params.id);
        if (updErr) throw updErr;

        res.json({ message: "Photo removed successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to remove photo" });
    }
});

/* ===============================
   UPDATE PASSWORD
================================ */
router.put("/:id/password", async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) return res.status(400).json({ message: "Both passwords required" });

    try {
        const { data, error } = await supabase.from('users').select('password_hash').eq('id', req.params.id).single();
        if (error || !data) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, data.password_hash);
        if (!isMatch) return res.status(401).json({ message: "Current password incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);
        const { error: updErr } = await supabase.from('users').update({ password_hash: hashed }).eq('id', req.params.id);
        if (updErr) throw updErr;

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Password update failed" });
    }
});

module.exports = router;
