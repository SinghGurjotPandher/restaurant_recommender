const { haversineDistance } = require('../utils/distance');

// How much historical preferences contribute (0-1). At 0.5, history can give max 12.5 of 25 cuisine pts.
const HISTORY_FACTOR = 0.5;

// Calculates score for a restaurant based on user preferences
function calculateScore(restaurant, preferences) {
    let total = 0;
    const breakdown = [];

    // 1. Cuisine match (25 pts) — weighted by cuisineWeights map
    const cuisineWeight = (preferences.cuisineWeights && preferences.cuisineWeights[restaurant.cuisine]) || 0;
    const cuisineScore = Math.round(cuisineWeight * 25);
    total += cuisineScore || 0;
    breakdown.push({ category: 'cuisine', points: cuisineScore || 0 });

    // 2. Budget fit (25 pts) (0-4 scale)
    const budgetDifference = Math.abs(restaurant.priceLevel - preferences.maxBudget);
    const budgetScore = Math.max(0, 25 - (budgetDifference * 10)); // -10 pts for each level difference
    total += budgetScore || 0;
    breakdown.push({ category: 'budget', points: budgetScore || 0 });
    //console.log('Budget Score:', budgetScore);  

    // 3. Distance (25 pts)
    const distance = haversineDistance(
        preferences.location.latitude,
        preferences.location.longitude,
        restaurant.latitude,
        restaurant.longitude
    );
    const distanceScore = Math.round(25 * Math.exp(-distance / 10)); // exponential decay past 10 miles
    total += distanceScore || 0;
    breakdown.push({ category: 'distance', points: distanceScore || 0, miles: distance.toFixed(2)});
    //console.log('Distance Score:', distanceScore, 'for distance:', distance);

    // 4. Rating (25 pts)
    const ratingScore = Math.round(((restaurant.rating || 0) / 5) * 25); // Scale rating to 25 pts
    total += ratingScore || 0;
    breakdown.push({ category: 'rating', points: ratingScore || 0 });
    //console.log('Rating Score:', ratingScore);

    return { total, breakdown };
}

// Checks if a restaurant passes hard constraints
function passesHardConstraints(restaurant, preferences) {
    const restriction = preferences.dietaryRestriction ?? preferences.dietaryRestrictions; // vegan or vegetarian

    if (!restriction) { // no restrictions
        return true;
    }

    if (restriction === 'vegan') {
        return restaurant.cuisine === 'Vegan';
    }

    if (restriction === 'vegetarian') {
        return restaurant.servesVegetarianFood === true || restaurant.cuisine === 'Vegan';
    }

    return true;
}

// Groups all user preferences into single preference object
// historicalWeights is an optional { cuisine: weight(0-1) } map from user history
function aggregateGroupPreferences(users, historicalWeights) {
    if (!users || users.length === 0) {
        throw new Error('At least one user is required to aggregate preferences.');
    }

    const allCuisines = [...new Set(users.flatMap(u => u.cuisines || []))];
    const maxBudget = Math.min(...users.map(u => u.maxBudget ?? 4));

    // Build cuisineWeights: explicit selections = 1.0, historical = normalized * HISTORY_FACTOR
    const cuisineWeights = {};
    // Explicit selections get full weight
    for (const cuisine of allCuisines) {
        cuisineWeights[cuisine] = 1.0;
    }
    // Merge historical weights (only if they exceed what's already there)
    if (historicalWeights) {
        for (const [cuisine, weight] of Object.entries(historicalWeights)) {
            const historicalScore = weight * HISTORY_FACTOR;
            cuisineWeights[cuisine] = Math.max(cuisineWeights[cuisine] || 0, historicalScore);
        }
    }

    let dietaryRestrictions = 'none';
    for (const user of users) {
        if (user.dietaryRestriction === 'vegan') { // highest restriction
            dietaryRestrictions = 'vegan';
            break;
        }
        if (user.dietaryRestriction === 'vegetarian') {
            dietaryRestrictions = 'vegetarian';
        }
    }

    // location is average of all users with a provided location
    const usersWithLocation = users.filter(u => u?.location?.latitude != null && u?.location?.longitude != null);
    const location = usersWithLocation.length > 0
        ? usersWithLocation.reduce((acc, user) => {
            acc.latitude += user.location.latitude;
            acc.longitude += user.location.longitude;
            return acc;
        }, { latitude: 0, longitude: 0 })
        : null;

    if (location) {
        location.latitude /= usersWithLocation.length;
        location.longitude /= usersWithLocation.length;
    }

    return {
        cuisines: allCuisines,
        cuisineWeights,
        maxBudget,
        dietaryRestrictions,
        location
    };
}

module.exports = {
    calculateScore,
    passesHardConstraints,
    aggregateGroupPreferences
};