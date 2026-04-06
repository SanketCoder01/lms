const express = require("express");
const router = express.Router();
const supabase = require("../config/db");
const bcrypt = require("bcryptjs");
const multer = require("multer");

/* ===============================
   FILE UPLOAD CONFIG
================================ */
const upload = multer({
  storage: multer.memoryStorage()
});

/* ===============================
   GET USER PROFILE
================================ */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, first_name, last_name, email, phone, job_title, location, profile_image')
      .eq('id', id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ===============================
   UPDATE USER PROFILE
================================ */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, phone, job_title, location } = req.body;

  try {
    const { error } = await supabase
      .from('users')
      .update({ first_name, last_name, phone, job_title, location })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

/* ===============================
   UPLOAD PROFILE PHOTO
================================ */
router.put("/photo/:id", upload.single("photo"), async (req, res) => {
  const { id } = req.params;

  if (!req.file || !req.file.buffer) {
    return res.status(400).json({ message: 'No photo uploaded' });
  }

  try {
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `avatars/user_${id}_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
        .from('lms-storage')
        .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
        });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
        .from('lms-storage')
        .getPublicUrl(fileName);

    const imagePath = publicUrlData.publicUrl;

    const { error } = await supabase
      .from('users')
      .update({ profile_image: imagePath })
      .eq('id', id);

    if (error) throw error;
    res.json({ image: imagePath });
  } catch (err) {
    res.status(500).json({ message: "Upload failed" });
  }
});

/* ===============================
   REMOVE PROFILE PHOTO
================================ */
router.delete("/photo/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('users')
      .update({ profile_image: null })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: "Photo removed" });
  } catch (err) {
    res.status(500).json({ message: "Remove failed" });
  }
});

/* ===============================
   CHANGE PASSWORD
================================ */
router.put("/password/:id", async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', id)
      .single();

    if (userError || !user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', id);

    if (updateError) throw updateError;

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
