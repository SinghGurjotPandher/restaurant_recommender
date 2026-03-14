const { run, query } = require('./database');

// UPSERT cuisine preferences: increment search_count for each cuisine
async function saveCuisinePreferences(userId, cuisines) {
    if (!userId || !cuisines || cuisines.length === 0) return;

    for (const cuisine of cuisines) {
        await run(
            `INSERT INTO user_cuisine_preferences (user_id, cuisine, search_count, last_updated)
             VALUES (?, ?, 1, CURRENT_TIMESTAMP)
             ON CONFLICT(user_id, cuisine) DO UPDATE SET
             search_count = search_count + 1,
             last_updated = CURRENT_TIMESTAMP`,
            [userId, cuisine]
        );
    }
}

// Get cuisine preferences for a single user as { cuisine: count } map
async function getCuisinePreferences(userId) {
    const rows = await query(
        'SELECT cuisine, search_count FROM user_cuisine_preferences WHERE user_id = ?',
        [userId]
    );
    const prefs = {};
    for (const row of rows) {
        prefs[row.cuisine] = row.search_count;
    }
    return prefs;
}

// Get aggregated + normalized cuisine weights for multiple users
// Returns { cuisine: weight } where weight is 0-1 (normalized by max frequency per user)
async function getCuisineWeightsForUsers(userIds) {
    if (!userIds || userIds.length === 0) return {};

    const placeholders = userIds.map(() => '?').join(',');
    const rows = await query(
        `SELECT user_id, cuisine, search_count FROM user_cuisine_preferences WHERE user_id IN (${placeholders})`,
        userIds
    );

    // Group by user
    const byUser = {};
    for (const row of rows) {
        if (!byUser[row.user_id]) byUser[row.user_id] = {};
        byUser[row.user_id][row.cuisine] = row.search_count;
    }

    // Normalize per-user (max frequency = 1.0), then merge across users (take max)
    const mergedWeights = {};
    for (const userId of Object.keys(byUser)) {
        const userPrefs = byUser[userId];
        const maxCount = Math.max(...Object.values(userPrefs));
        if (maxCount === 0) continue;

        for (const [cuisine, count] of Object.entries(userPrefs)) {
            const normalized = count / maxCount;
            mergedWeights[cuisine] = Math.max(mergedWeights[cuisine] || 0, normalized);
        }
    }

    return mergedWeights;
}

module.exports = { saveCuisinePreferences, getCuisinePreferences, getCuisineWeightsForUsers };
