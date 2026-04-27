const express = require('express');
const router = express.Router();
const supabase = require('../config/db');

router.get('/states', async (req, res) => {
    try {
        const { data, error } = await supabase.from('states').select('*').order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Error fetching states", err);
        res.status(500).json({ message: "Failed to fetch states" });
    }
});

router.get('/cities/:stateId', async (req, res) => {
    try {
        const { data, error } = await supabase.from('cities').select('*').eq('state_id', req.params.stateId).eq('is_active', true).order('name');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        console.error("Error fetching cities", err);
        res.status(500).json({ message: "Failed to fetch cities" });
    }
});

module.exports = router;
