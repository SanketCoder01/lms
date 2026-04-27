const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// Development route to create a test user - Remove in production!
router.post('/create-test-user', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        // Check if user exists
        const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [full_name || email, email, hashedPassword, 'admin']
        );

        res.json({ 
            message: 'Test user created successfully',
            email: email,
            password: password,
            userId: result.insertId
        });
    } catch (error) {
        console.error('Error creating test user:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

