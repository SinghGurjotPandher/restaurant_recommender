const { calculateScore, passesHardConstraints } = require('../../services/scoring');

describe('Restaurant Scoring Algorithm', () => {
    
    // mock data
    const mockRestaurant = {
        id: 1, 
        name: "Test Restaurant",
        cuisine: "Chinese",
        price_level: 3,
        rating: 4.5,
        latitude: 33.6405,
        longitude: -117.8443,
        dietary_options: ['vegetarian']
    };

    const mockPreferences = {
        cuisines: ['Chinese'],
        maxBudget: 2,
        maxDistance: 2,
        location: { latitude: 33.6405, longitude: -117.8443 },
        dietaryRestrictions: ['vegetarian'],
        allergies: []
    };

    // tests for cuisine match and hard constraints
    test('Should score high for cuisine points', () => {
        const result = calculateScore(mockRestaurant, mockPreferences);
        expect(result.total).toBeGreaterThan(50);
        expect(result.breakdown.find(b => b.category === 'cuisine').points).toBe(25);
    });

    test('Should pass hard constraints for dietary restrictions', () => {
        const passes = passesHardConstraints(mockRestaurant, mockPreferences);
        expect(passes).toBe(true);
    });

    test('Should fail hard constraints for allergies', () => {
        const veganRestaurant = { ...mockRestaurant, allergens: ['peanuts'] }; // has peanuts
        const passes = passesHardConstraints(veganRestaurant, { ...mockPreferences, allergies: ['peanuts'] }); // allergic to peanuts
        expect(passes).toBe(false);
    });

    test('Should fail hard constraints if dietary restrictions not met', () => {
        const nonVegRestaurant = { ...mockRestaurant, dietary_options: [] }; // no alternative dietary options (i.e. vegetarian)
        const passes = passesHardConstraints(nonVegRestaurant, mockPreferences); // user is vegetarian
        expect(passes).toBe(false);
    });

    // test for budget scoring
    test('Should score lower for budget mismatch (not eliminate though)', () => {
        const expensiveRestaurant = { ...mockRestaurant, price_level: 4 };
        const result = calculateScore(expensiveRestaurant, mockPreferences);

        expect(result.total).toBeGreaterThan(0); // not eliminated
        expect(result.breakdown.find(b => b.category === 'budget').points).toBeLessThan(25); // does not get full budget points
    });

    // test for distance scoring
    test('Should score lower for distant restaurant', () => {
        const distantRestaurant = { ...mockRestaurant, latitude: 34.0522, longitude: -118.2437 };
        const result = calculateScore(distantRestaurant, mockPreferences);

        expect(result.total).toBeGreaterThan(0); // not eliminated
        expect(result.breakdown.find(b => b.category === 'distance').points).toBeLessThan(25); // does not get full distance points
    });
});