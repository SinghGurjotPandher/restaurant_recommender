const express = require('express');
const router = express.Router();
const recommendationsService = require('../services/recommendations');
const { optionalAuth } = require('../middleware/auth');
const userPreferences = require('../services/userPreferences');

// POST /api/recommendations
router.post('/', optionalAuth, async (req, res) => {
    try {
        const { users, location, radius, forceRefresh, sessionCode } = req.body;

        // Basic validation
        if (!users || !Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ error: 'Users list is required and cannot be empty.' });
        }

        if (!location || !location.lat || !location.lng) {
            return res.status(400).json({ error: 'Valid location (lat/lng) is required.' });
        }

        // Collect authenticated user IDs (from JWT + from session members)
        const authenticatedUserIds = [];
        if (req.user) {
            authenticatedUserIds.push(req.user.id);
        }

        // If in a group session, find other authenticated members
        const sessions = req.app.get('sessions');
        if (sessionCode && sessions) {
            const roomCode = sessionCode.toUpperCase();
            const sessionUsers = sessions[roomCode];
            if (sessionUsers) {
                for (const su of sessionUsers) {
                    if (su.userId && !authenticatedUserIds.includes(su.userId)) {
                        authenticatedUserIds.push(su.userId);
                    }
                }
            }
        }

        // Load historical cuisine weights for all authenticated users
        const historicalWeights = await userPreferences.getCuisineWeightsForUsers(authenticatedUserIds);

        // Call the service with historical weights
        const results = await recommendationsService.getRecommendations(users, location, radius, forceRefresh, historicalWeights);

        // Save cuisine preferences for authenticated users who made this search
        const allCuisines = [...new Set(users.flatMap(u => u.cuisines || []))];
        if (allCuisines.length > 0) {
            for (const uid of authenticatedUserIds) {
                userPreferences.saveCuisinePreferences(uid, allCuisines).catch(err => {
                    console.error('Failed to save cuisine preferences:', err);
                });
            }
        }

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