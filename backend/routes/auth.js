const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// IMPORT THE WRAPPER FUNCTIONS from your database.js
const { run, query } = require('../services/database'); 
const { requireAuth } = require('../middleware/auth');
const userPreferences = require('../services/userPreferences');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const {email, password, displayName} = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required."});
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters."});
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use your custom 'run' function
        const result = await run(
            'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)', 
            [email, hashedPassword, displayName || '']
        );
        
        // sqlite3 uses .lastID instead of .lastInsertRowid
        const userId = result.lastID; 

        const token = jwt.sign({ id: userId, email: email}, process.env.JWT_SECRET, { expiresIn: '24h'});

        res.status(201).json({ 
            message: 'User created successfully', 
            token,
            user: { id: userId, email, displayName: displayName || '' }
        });
    } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email already exists.'});
        }
        console.error("Registration failed:", err);
        res.status(500).json({error: 'Internal server error.'});
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const {email, password} = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.'});
    }

    try {
        // Use your custom 'query' function
        const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0]; // query (db.all) returns an array of results

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.'})
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password.'});
        }

        const token = jwt.sign({ id: user.id, email: user.email}, process.env.JWT_SECRET, {expiresIn: '24h'});
        res.json({ 
            message: 'Logged in successfully', 
            token,
            user: { id: user.id, email: user.email, displayName: user.display_name || '' }
        });
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ error: 'Internal server error.'});
    }
});

// GET /api/auth/me — returns user profile + cuisine history
router.get('/me', requireAuth, async (req, res) => {
    try {
        const rows = await query('SELECT id, email, display_name, created_at FROM users WHERE id = ?', [req.user.id]);
        const user = rows[0];
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const cuisinePrefs = await userPreferences.getCuisinePreferences(user.id);

        res.json({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.display_name || '',
                createdAt: user.created_at
            },
            cuisinePreferences: cuisinePrefs
        });
    } catch (err) {
        console.error("Get profile failed:", err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// PUT /api/auth/profile — update display name
router.put('/profile', requireAuth, async (req, res) => {
    const { displayName } = req.body;

    if (displayName === undefined) {
        return res.status(400).json({ error: 'displayName is required.' });
    }

    try {
        await run('UPDATE users SET display_name = ? WHERE id = ?', [displayName, req.user.id]);
        res.json({ message: 'Profile updated.', user: { id: req.user.id, email: req.user.email, displayName } });
    } catch (err) {
        console.error("Profile update failed:", err);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;