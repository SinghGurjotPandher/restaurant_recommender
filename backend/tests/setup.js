process.env.NODE_ENV = 'test';
process.env.GOOGLE_PLACES_API_KEY = 'test_google_key';

global.mocklocation = {
    lat: 33.6405,
    lng: -117.8443
};

global.mockPreferences = {
    cuisines: ['Chinese', 'Mexican'],
    maxBudget: 3, 
    maxDistance: 5,
    location: global.mocklocation
};