const express = require('express');
const router = express.Router();
const recommendationsService = require('../services/recommendations');

// POST /api/recommendations
router.post('/', async (req, res) => {
    try {
        const { users, location, radius } = req.body;

        // Basic validation
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Users list is required and cannot be empty.' });
        }

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ error: 'Valid location (lat/lng) is required.' });
        }

        // Call the service
        const results = await recommendationsService.getRecommendations(users, location, radius);

        res.json({
            success: true,
            count: results.length,
            recommendations: results
        });

    } catch (error) {
        console.error('Route Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;