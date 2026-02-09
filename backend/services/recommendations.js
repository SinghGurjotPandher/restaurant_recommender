const db = require('./database');
const GooglePlacesAPI = require('./googlePlaces');
const scoring = require('./scoring');

const googlePlaces = new GooglePlacesAPI();

// Main function to get recommendations
async function getRecommendations(users, userLocation, radius = 2000) {
    try {
        // 1. Aggregate group preferences (using your scoring.js helper)
        const groupPrefs = scoring.aggregateGroupPreferences(users);

        // Ensure we have a valid location (use group center if provided, else fallback)
        const center = userLocation || groupPrefs.location;

        // Normalize group location for scoring (scoring expects latitude/longitude)
        if (userLocation?.lat != null && userLocation?.lng != null) {
            groupPrefs.location = { latitude: userLocation.lat, longitude: userLocation.lng };
        }

        // 2. Check Cache: Get restaurants within a rough box of the location
        // (Simplified for SQLite: just getting all and filtering in JS for this prototype)
        // In a real app, you'd use spatial SQL, but this is fine for a class project.
        const cachedRestaurants = await db.query(
            `SELECT * FROM restaurant_cache 
             WHERE abs(latitude - ?) < 0.1 AND abs(longitude - ?) < 0.1`,
            [center.lat, center.lng]
        );

        let restaurants = cachedRestaurants;

        // 3. Cache Miss Strategy: If we have too few results, hit Google API
        if (restaurants.length < 5) {
            console.log('Cache miss or low results. Fetching from Google Places...');
            const apiResults = await googlePlaces.nearbySearch(center.lat, center.lng, radius);

            // Save new results to DB
            for (const place of apiResults) {
                await saveToCache(place);
            }

            // Re-fetch combined list
            restaurants = await db.query(
                `SELECT * FROM restaurant_cache 
                 WHERE abs(latitude - ?) < 0.1 AND abs(longitude - ?) < 0.1`,
                [center.lat, center.lng]
            );
        }

        // 4. Process Results: Filter and Score
        const scoredResults = restaurants
            .map(r => {
                // normalize DB columns to match scoring expectation if needed
                const restaurantObj = {
                    ...r,
                    cuisine: r.cuisine,
                    priceLevel: r.price_level,
                    servesVegetarianFood: r.serves_vegetarian_food
                };

                // Check hard constraints
                if (!scoring.passesHardConstraints(restaurantObj, groupPrefs)) {
                    return null;
                }

                // Calculate score
                const { total, breakdown } = scoring.calculateScore(restaurantObj, groupPrefs);

                return {
                    ...restaurantObj,
                    score: total,
                    breakdown,
                    location: { lat: r.latitude, lng: r.longitude } // format for frontend
                };
            })
            .filter(r => r !== null) // remove filtered out restaurants
            .sort((a, b) => b.score - a.score) // Sort highest score first
            .slice(0, 20); // Top 20

        return scoredResults;

    } catch (error) {
        console.error('Error in service:', error);
        throw error;
    }
}

// Helper to upsert (update or insert) into cache
async function saveToCache(place) {
    const sql = `
        INSERT INTO restaurant_cache 
        (google_place_id, name, cuisine, address, latitude, longitude, rating, user_ratings_total, price_level, serves_vegetarian_food, website, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+7 days'))
        ON CONFLICT(google_place_id) DO UPDATE SET
        rating=excluded.rating,
        user_ratings_total=excluded.user_ratings_total,
        cached_at=CURRENT_TIMESTAMP
    `;

    const params = [
        place.googlePlaceId,
        place.name,
        place.cuisine,
        place.address,
        place.latitude,
        place.longitude,
        place.rating,
        place.userRatingCount,
        place.priceLevel === 'Price level not available' ? null : place.priceLevel, // sanitize
        place.servesVegetarianFood,
        place.website
    ];

    await db.run(sql, params);
}

module.exports = { getRecommendations };