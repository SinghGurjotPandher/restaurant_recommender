const { haversineDistance } = require('../utils/distance');

// Calculates score for a restaurant based on user preferences
function calculateScore(restaurant, preferences) {
    let total = 0;
    const breakdown = [];

    // 1. Cuisine match (25 pts)
    const cuisineScore = preferences.cuisines.includes(restaurant.cuisine) ? 25 : 0;
    total += cuisineScore;
    breakdown.push({ category: 'cuisine', points: cuisineScore });

    // 2. Budget fit (25 pts)
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
    breakdown.push({ category: 'distance', points: Math.round(distanceScore) });

    // 4. Rating (25 pts)
    const ratingScore = Math.round((restaurant.rating / 5) * 25); // Scale rating to 25 pts
    total += ratingScore;
    breakdown.push({ category: 'rating', points: ratingScore });

    // Other factors?
    // # of recent positive reviews?
    // Many recent visitors?

    return { total, breakdown };
}

// Checks if a restaurant passes hard constraints
function passesHardConstraints(restaurant, preferences) {
    
    // 1. Dietary restrictions
    if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
        const restaurantOptions = restaurant.dietary_options || [];
        const hasAllDietary = preferences.dietaryRestrictions.every(restriction =>
            restaurantOptions.includes(restriction)
        );
        if (!hasAllDietary) return false;
    }

    // 2. Allergy considerations
    if (preferences.allergies && preferences.allergies.length > 0) {
        const restaurantAllergens = restaurant.allergens || [];
        const hasAllergens = preferences.allergies.some(allergy =>
            restaurantAllergens.includes(allergy)
        );
        if (hasAllergens) return false;
    }

    return true;
}

module.exports = {
    calculateScore,
    passesHardConstraints
};