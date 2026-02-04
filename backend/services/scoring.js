const { haversineDistance } = require('../utils/distance');

// Calculates score for a restaurant based on user preferences
function calculateScore(restaurant, preferences) {
    let total = 0;
    const breakdown = [];

    // 1. Cuisine match (25 pts)
    const cuisineScore = preferences.cuisines.includes(restaurant.cuisine) ? 25 : 0;
    total += cuisineScore;
    breakdown.push({ category: 'cuisine', points: cuisineScore });

    // 2. Budget fit (25 pts) (0-4 scale)
    const budgetDifference = Math.abs(restaurant.price_level - preferences.maxBudget);
    const budgetScore = Math.max(0, 25 - (budgetDifference * 10)); // -10 pts for each level difference
    total += budgetScore;
    breakdown.push({ category: 'budget', points: budgetScore });

    // 3. Distance (25 pts)
    const distance = haversineDistance(
        preferences.location.latitude,
        preferences.location.longitude,
        restaurant.latitude,
        restaurant.longitude
    );
    const distanceScore = Math.round(25 * Math.exp(-distance / 10)); // exponential decay past 10 miles
    total += distanceScore;
    breakdown.push({ category: 'distance', points: distanceScore, miles: distance.toFixed(2)});

    // 4. Rating (25 pts)
    const ratingScore = Math.round(((restaurant.rating || 0) / 5) * 25); // Scale rating to 25 pts
    total += ratingScore;
    breakdown.push({ category: 'rating', points: ratingScore });

    // Other factors?
    // # of recent positive reviews?
    // Many recent visitors?

    return { total, breakdown };
}

// Checks if a restaurant passes hard constraints
function passesHardConstraints(restaurant, preferences) {
    const restriction = preferences.dietaryRestrictions; // vegan or vegetarian

    if (!restriction || restriction.length === 0) { // no restrictions
        return true;
    }

    if (restriction === 'vegan') {
        return restaurant.cuisine === 'vegan';
    }

    if (restriction === 'vegetarian') {
        return restaurant.servesVegetarianFood === true || restaurant.cuisine === 'vegan';
    }

    return true;
}

// Groups all user preferences into single preference object
function aggregateGroupPreferences(users) {
    if (!users || users.length === 0) {
        throw new Error('No users provided for preference aggregation');
    }

    const allCuisines = [...new Set(users.flatMap(u => u.cuisines || []))];
    const maxBudget = Math.min(...users.map(u => u.maxBudget ?? 4));

    let dietaryRestrictions = null;
    for (const user of users) {
        if (user.dietaryRestrictions === 'vegan') {
            dietaryRestrictions = 'vegan';
            break;
        }
        if (user.dietaryRestrictions === 'vegetarian') {
            dietaryRestrictions = 'vegetarian';
        }
    }

    const location = users.reduce((acc, user) => {
        acc.latitude += user.location.latitude;
        acc.longitude += user.location.longitude;
        return acc;
    }, { latitude: 0, longitude: 0 });

    location.latitude /= users.length;
    location.longitude /= users.length;

    return {
        cuisines: allCuisines,
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