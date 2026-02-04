const GooglePlacesAPI = require('../../services/googlePlaces');
const axios = require('axios');

jest.mock('axios');
const mockedAxios = axios;

describe('Google Places API', () => {
    let googlePlaces;

    beforeEach(()=>{
        googlePlaces = new GooglePlacesAPI();
        jest.clearAllMocks();
    });

    // suite for API connection tests
    describe('API Connection Tests', ()=>{

        // test for successful nearby search
        test('should handle successful nearby search', async ()=>{
            const mockResponse = {
                data: {
                    status: 'OK',
                    results: [{
                        place_id: 'test_place_id',
                        name: 'Test Restaurant',
                        types: ['restaurant'],
                        rating: 4.5,
                        price_level: 2,
                        geometry: {
                            location: {
                                lat: 33.6405,
                                lng: -117.8443
                            }
                        },
                        vicinity: 'Test Address'
                    }]
                }
            };

            mockedAxios.get.mockResolvedValueOnce(mockResponse);

            const result = await googlePlaces.nearbySearch({
                lat: 33.6405,
                lng: -117.8443,
                radius: 5000,
            });

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Test Restaurant');
            expect(result[0].google_place_id).toBe('test_place_id');
        });

        // test for API error handling
        test('should fallback on API error', async ()=>{
            mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

            const result = await googlePlaces.nearbySearch({
                lat: 33.6405,
                lng: -117.8443,
                radius: 5000,
            });

            expect(result).toHaveLength(3);
            expect(result[0].score).toBe('mock_google');
        });

        test('should handle API key missing', async ()=>{
            const apiWithoutKey = new GooglePlacesAPI();
            apiWithoutKey.apiKey = null;

            const result = await apiWithoutKey.nearbySearch({
                lat: 33.6405,
                lng: -117.8443,
            });

            expect(result).toBeDefined();
            expect(result[0].source).toBe('mock_google');
        });
    });

    // suite for data formatting
    describe('Data Formatting', ()=>{

        // test for cuisine type extraction
        test('should extract cuisine type correctly', ()=>{
            const cuisine1 = googlePlaces.extractCuisineType(['restaurant', 'chinese_restaurant']);
            expect(cuisine1).toBe('Chinese');

            const cuisine2 = googlePlaces.extractCuisineType(['restaurant', 'meal_takeaway']);
            expect(cuisine2).toBe('Fast Food');

            const cuisine3 = googlePlaces.extractCuisineType(['restaurant']);
            expect(cuisine3).toBe('Restaurant');
        });

        // test for opening hours extraction
        test('should format opening hours correctly', ()=>{
            const mockHours = {
                periods: [
                    { open: { day: 1, time: '0900' }, close: { day: 1, time: '2100' } },
                    { open: { day: 2, time: '0900' }, close: { day: 2, time: '2100' } },
                    { open: { day: 3, time: '0900' }, close: { day: 3, time: '2100' } }
                ]
            };
            
            const formattedHours = googlePlaces.formatOpeningHours(mockHours);
            const parsed = JSON.parse(formattedHours);

            expect(parsed.Monday).toBe('09:00 - 21:00');
            expect(parsed.Tuesday).toBe('09:00 - 21:00');
            expect(parsed.Wednesday).toBe('09:00 - 21:00');
        });
    });

    // suite for rate limiting
    describe('rate limiting', ()=>{
        test('should respect rate limits', async ()=>{
            const startTime = Date.now();

            await googlePlaces.waitForRateLimit();
            await googlePlaces.waitForRateLimit();

            const endTime = Date.now();
            const elapsed = endTime - startTime;

            expect(elapsed).toBeGreaterThanOrEqual(600); // minimum interval for google places API request
        });
    });
});