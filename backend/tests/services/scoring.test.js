const { calculateScore, passesHardConstraints, aggregateGroupPreferences } = require('../../services/scoring');

describe('calculateScore', () => {
    const baseRestaurant = {
        cuisine: 'Italian',
        priceLevel: 2,
        latitude: 33.6846,
        longitude: -117.8265,
        rating: 5
    };

    const basePreferences = {
        cuisines: ['Italian', 'Mexican'],
        maxBudget: 2,
        location: { latitude: 33.6846, longitude: -117.8265 }
    };

    test('returns max score for perfect match at same location', () => {
        const result = calculateScore(baseRestaurant, basePreferences);
        expect(result.total).toBe(100); 
        expect(result.breakdown).toHaveLength(4);
    });

    test('cuisine mismatch scores 0 for cuisine category', () => {
        const restaurant = { ...baseRestaurant, cuisine: 'Thai' };
        const result = calculateScore(restaurant, basePreferences);
        const cuisineBreakdown = result.breakdown.find(b => b.category === 'cuisine');
        expect(cuisineBreakdown.points).toBe(0);
    });

    test('budget mismatch reduces score by 10 per level difference', () => {
        const restaurant = { ...baseRestaurant, priceLevel: 4 }; // 2 levels above
        const result = calculateScore(restaurant, basePreferences);
        const budgetBreakdown = result.breakdown.find(b => b.category === 'budget');
        expect(budgetBreakdown.points).toBe(5);
    });

    test('distance decay reduces score for far restaurants', () => {
        const farRestaurant = { ...baseRestaurant, latitude: 34.0522, longitude: -118.2437 }; // 40 miles
        const result = calculateScore(farRestaurant, basePreferences);
        const distanceBreakdown = result.breakdown.find(b => b.category === 'distance');
        expect(distanceBreakdown.points).toBeLessThan(5);
    });

    test('handles missing rating', () => {
        const restaurant = { ...baseRestaurant, rating: undefined };
        const result = calculateScore(restaurant, basePreferences);
        const ratingBreakdown = result.breakdown.find(b => b.category === 'rating');
        expect(ratingBreakdown.points).toBe(0);
    });
});

describe('passesHardConstraints', () => {
    test('no restriction allows all restaurants', () => {
        const restaurant = { cuisine: 'Steakhouse', servesVegetarianFood: false };
        const preferences = { dietaryRestriction: null };
        expect(passesHardConstraints(restaurant, preferences)).toBe(true);
    });

    test('vegetarian restriction passes if servesVegetarianFood is true', () => {
        const restaurant = { cuisine: 'Italian', servesVegetarianFood: true };
        const preferences = { dietaryRestriction: 'vegetarian' };
        expect(passesHardConstraints(restaurant, preferences)).toBe(true);
    });

    test('vegetarian restriction fails if servesVegetarianFood is false', () => {
        const restaurant = { cuisine: 'Steakhouse', servesVegetarianFood: false };
        const preferences = { dietaryRestriction: 'vegetarian' };
        expect(passesHardConstraints(restaurant, preferences)).toBe(false);
    });

    test('vegetarian restriction passes for vegan restaurants', () => {
        const restaurant = { cuisine: 'Vegan', servesVegetarianFood: false };
        const preferences = { dietaryRestriction: 'vegetarian' };
        expect(passesHardConstraints(restaurant, preferences)).toBe(true);
    });

    test('vegan restriction only passes for vegan cuisine type', () => {
        const veganRestaurant = { cuisine: 'Vegan', servesVegetarianFood: true };
        const vegetarianRestaurant = { cuisine: 'Indian', servesVegetarianFood: true };

        expect(passesHardConstraints(veganRestaurant, { dietaryRestriction: 'vegan' })).toBe(true);
        expect(passesHardConstraints(vegetarianRestaurant, { dietaryRestriction: 'vegan' })).toBe(false);
    });
});

describe('aggregateGroupPreferences', () => {
    test('unions all cuisines from group', () => {
        const users = [
            { cuisines: ['Italian', 'Thai'], maxBudget: 3, location: { latitude: 33.68, longitude: -117.82 } },
            { cuisines: ['Mexican', 'Thai'], maxBudget: 2, location: { latitude: 33.68, longitude: -117.82 } }
        ];
        const result = aggregateGroupPreferences(users);
        expect(result.cuisines).toEqual(expect.arrayContaining(['Italian', 'Thai', 'Mexican']));
        expect(result.cuisines).toHaveLength(3);
    });

    test('takes lowest maxBudget as most restrictive', () => {
        const users = [
            { cuisines: [], maxBudget: 4, location: { latitude: 0, longitude: 0 } },
            { cuisines: [], maxBudget: 1, location: { latitude: 0, longitude: 0 } },
            { cuisines: [], maxBudget: 3, location: { latitude: 0, longitude: 0 } }
        ];
        const result = aggregateGroupPreferences(users);
        expect(result.maxBudget).toBe(1);
    });

    test('vegan is most restrictive dietary (overrides vegetarian)', () => {
        const users = [
            { cuisines: [], maxBudget: 2, dietaryRestriction: 'vegetarian', location: { latitude: 0, longitude: 0 } },
            { cuisines: [], maxBudget: 2, dietaryRestriction: 'vegan', location: { latitude: 0, longitude: 0 } }
        ];
        const result = aggregateGroupPreferences(users);
        expect(result.dietaryRestrictions).toBe('vegan');
    });

    test('vegetarian is used if no vegan user', () => {
        const users = [
            { cuisines: [], maxBudget: 2, dietaryRestriction: null, location: { latitude: 0, longitude: 0 } },
            { cuisines: [], maxBudget: 2, dietaryRestriction: 'vegetarian', location: { latitude: 0, longitude: 0 } }
        ];
        const result = aggregateGroupPreferences(users);
        expect(result.dietaryRestrictions).toBe('vegetarian');
    });

    test('throws error for empty users array', () => {
        expect(() => aggregateGroupPreferences([])).toThrow('At least one user is required');
    });
});