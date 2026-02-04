const axios = require('axios');

class GooglePlacesAPI {
    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
        this.lastRequest = 0;
        this.minInterval = 600; // 600 ms
    }

    // enforce rate limiting between requests
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < this.minInterval) { // force a wait if limit exceeded
            const waitTime = this.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.lastRequest = Date.now();
    }

    // fetch nearby places of a specific type
    async nearbySearch(params) {
        if (!this.apiKey) {
            throw new Error('Google Places API key is not set in environment variables.');
        }

        try {
            await this.waitForRateLimit();
            const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
                params: {
                    key: this.apiKey,
                    location: `${params.lat},${params.lng}`,
                    radius: params.radius,
                    type: 'restaurant',
                    ...params
                },
                timeout: 10000
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'No additional error message'}`);
            }

            return response.data.results;
        } catch (error) {
            throw new Error(`Failed to fetch nearby places: ${error.message}`);
        }
    }

    // fetch place details by place ID
    async placeDetails(placeId, fields = []) {
        if (!this.apiKey) {
            throw new Error('Google Places API key is not set in environment variables.');
        }

        try {
            await this.waitForRateLimit();

            const defaultFields = [
                'place_id',
                'name',
                'formatted_address',
                'geometry',
                'rating',
                'price_level',
                'opening_hours',
                'formatted_phone_number'
            ];

            const requestFields = fields.length > 0 ? fields : defaultFields;

            const response = await axios.get(`${this.baseUrl}/details/json`, {
                params: {
                    key: this.apiKey,
                    place_id: placeId,
                    fields: requestFields.join(',')
                },
                timeout: 10000
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'No additional error message'}`);
            }

            return response.data.result;
        } catch (error) {
            throw new Error(`Failed to fetch place details: ${error.message}`);
        }
    }

    // format API response into our database schema
    formatNearbyResutls(results) {
        return results.map(places => ({
            google_place_id: places.place_id,
            name: places.name,
            cuisine: this.extractCuisineFromTypes(places.types),
            price_level: places.price_level || null,
            rating: places.rating || null,
            latitude: places.geometry.location.lat,
            longitude: places.geometry.location.lng,
            address: places.vicinity || null,
            is_open: places.opening_hours ? places.opening_hours.open_now : null,
            photo_reference: places.photos && places.photos.length > 0 ? places.photos[0].photo_reference : null,
            source: 'google_places'
        }))
    }

    formatPlaceDetails(result) {
        return {
            google_place_id: result.place_id,
            name: result.name,
            address: result.formatted_address || null,
            phone: result.formatted_phone_number || null,
            rating: result.rating || null,
            price_level: result.price_level || null,
            hours: this.formatOpeningHours(result.opening_hours),
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            source: 'google_places'
        }
    }

    // helper functions
    extractCuisineFromTypes(types) {
        const cuisineMapping = {
            'chinese_restaurant': 'Chinese',
            'mexican_restaurant': 'Mexican',
            'italian_restaurant': 'Italian',
            'japanese_restaurant': 'Japanese',
            'thai_restaurant': 'Thai',
            'indian_restaurant': 'Indian',
            'american_restaurant': 'American',
            'fast_food_restaurant': 'Fast Food'
        };
        
        for (const type of types) {
            if (cuisineMapping[type]) {
                return cuisineMapping[type];
            }
        }
        
        return 'Restaurant';
    }

    formatOpeningHours(openingHours) {
        if(!openingHours?.periods) return null;

        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const hours = {};

        openingHours.periods.forEach(period => {
            const day = days[period.open.day];
            if(period.open && period.close) {
                hours[day] = `${period.open.time} - ${period.close.time}`;
            } else if(period.open) {
                hours[day] = '24h';
            }
        });

        return JSON.stringify(hours);
    }

    isConfigured() {
        return !!this.apiKey;
    }
}