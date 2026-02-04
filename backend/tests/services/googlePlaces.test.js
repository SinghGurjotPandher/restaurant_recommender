const axios = require('axios');
const GooglePlacesAPI = require('../../services/googlePlaces');

jest.mock('axios');

describe('GooglePlacesAPI', () => {
    const mockApiKey = 'custom-key';
    let api;

    beforeEach(() => {
        process.env.GOOGLE_PLACES_API_KEY = mockApiKey;
        api = new GooglePlacesAPI(mockApiKey);
        jest.clearAllMocks();
    });

    afterEach(() => {
        delete process.env.GOOGLE_PLACES_API_KEY;
    });

    describe('constructor', () => {
        test('throws error if no API key provided', () => {
            delete process.env.GOOGLE_PLACES_API_KEY;
            expect(() => new GooglePlacesAPI()).toThrow('GOOGLE_PLACES_API_KEY environment variable is required');
        });

        test('initializes with provided API key', () => {
            const api = new GooglePlacesAPI('custom-key');
            expect(api.apiKey).toBe('custom-key');
        });
    });

    describe('nearbySearch', () => {
        test('returns formatted restaurants on success', async () => {
            axios.post.mockResolvedValueOnce({
                data: {
                    places: [
                        {
                            id: 'place123',
                            displayName: { text: 'Test Restaurant' },
                            types: ['italian_restaurant'],
                            primaryType: 'italian_restaurant',
                            formattedAddress: '123 Main St',
                            location: { latitude: 33.68, longitude: -117.82 },
                            rating: 4.5,
                            userRatingCount: 200,
                            priceLevel: 'PRICE_LEVEL_MODERATE',
                            servesVegetarianFood: true
                        }
                    ]
                }
            });

            const results = await api.nearbySearch(33.68, -117.82, 5000);

            expect(results).toHaveLength(1);
            expect(results[0]).toEqual({
                googlePlaceId: 'place123',
                name: 'Test Restaurant',
                cuisine: 'Italian',
                address: '123 Main St',
                latitude: 33.68,
                longitude: -117.82,
                rating: 4.5,
                userRatingCount: 200,
                priceLevel: 2,
                servesVegetarianFood: true,
                website: null
            });
        });

        test('returns empty array on API error', async () => {
            axios.post.mockRejectedValueOnce(new Error('Network error'));

            const results = await api.nearbySearch(33.68, -117.82);

            expect(results).toEqual([]);
        });

        test('returns empty array when no places found', async () => {
            axios.post.mockResolvedValueOnce({ data: {} });

            const results = await api.nearbySearch(33.68, -117.82);

            expect(results).toEqual([]);
        });
    });

    describe('formatPlace', () => {
        test('formats vegan restaurant correctly', () => {
            const place = {
                id: 'vegan1',
                displayName: { text: 'Green Garden' },
                types: ['vegan_restaurant', 'restaurant'],
                primaryType: 'vegan_restaurant',
                location: { latitude: 33.5, longitude: -117.5 },
                rating: 4.8,
                priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
                servesVegetarianFood: true
            };

            const result = api.formatPlace(place);

            expect(result.cuisine).toBe('Vegan');
            expect(result.servesVegetarianFood).toBe(true);
            expect(result.priceLevel).toBe(1);
        });

        test('handles missing fields gracefully', () => {
            const place = { id: 'minimal' };

            const result = api.formatPlace(place);

            expect(result.googlePlaceId).toBe('minimal');
            expect(result.name).toBe('Unknown');
            expect(result.cuisine).toBe('Restaurant');
            expect(result.servesVegetarianFood).toBe(false);
            expect(result.priceLevel).toBe('Price level not available');
        });
    });

    describe('extractCuisine', () => {
        test('prioritizes primaryType over types array', () => {
            const result = api.extractCuisine(['cafe', 'restaurant'], 'mexican_restaurant');
            expect(result).toBe('Mexican');
        });

        test('falls back to types array if primaryType unknown', () => {
            const result = api.extractCuisine(['thai_restaurant', 'restaurant'], 'food');
            expect(result).toBe('Thai');
        });

        test('returns Restaurant for unknown types', () => {
            const result = api.extractCuisine(['establishment', 'point_of_interest'], null);
            expect(result).toBe('Restaurant');
        });
    });

    describe('normalizePriceLevel', () => {
        test.each([
            ['PRICE_LEVEL_FREE', 0],
            ['PRICE_LEVEL_INEXPENSIVE', 1],
            ['PRICE_LEVEL_MODERATE', 2],
            ['PRICE_LEVEL_EXPENSIVE', 3],
            ['PRICE_LEVEL_VERY_EXPENSIVE', 4],
            [undefined, 'Price level not available'],
            [null, 'Price level not available']
        ])('normalizes %s to %i', (input, expected) => {
            expect(api.normalizePriceLevel(input)).toBe(expected);
        });
    });
});