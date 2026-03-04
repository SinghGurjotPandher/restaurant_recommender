const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// IMPORT THE WRAPPER FUNCTIONS from your database.js
const { run, query } = require('../services/database'); 
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required."});
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Use your custom 'run' function
        const result = await run(
            'INSERT INTO users (email, password_hash) VALUES (?, ?)', 
            [email, hashedPassword]
        );
        
        // sqlite3 uses .lastID instead of .lastInsertRowid
        const userId = result.lastID; 

        const token = jwt.sign({ id: userId, email: email}, process.env.JWT_SECRET, { expiresIn: '24h'});

        res.status(201).json({ message: 'User created successfully', token});
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
        res.json({ message: 'Logged in successfully', token});
    } catch (err) {
        console.error("Login failed:", err);
        res.status(500).json({ error: 'Internal server error.'});
    }
})

module.exports = router;