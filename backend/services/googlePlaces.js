const axios = require('axios');

class GooglePlacesAPI {
    constructor() {
        this.apiKey = process.env.GOOGLE_PLACES_API_KEY;
        this.baseUrl = 'https://places.googleapis.com/v1';
        this.lastRequest = 0;
        this.minInterval = 600; // 600ms between reqs

        if(!this.apiKey) {
            throw new Error('GOOGLE_PLACES_API_KEY environment variable is required');
        }
    }

    // helper function to enforce rate limiting
    async waitForRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;

        if (timeSinceLastRequest < this.minInterval) {
            const waitTime = this.minInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.lastRequest = Date.now();
    }

    // nearby search endpoint
    async nearbySearch(lat, lng, radius = 5000) {
        await this.waitForRateLimit();

        try {
            const response = await axios.post(
                `${this.baseUrl}/places:searchNearby`,
                {
                    includedTypes: ['restaurant'],
                    maxResultCount: 20,
                    locationRestriction: {
                        circle: {
                            center: { latitude: lat, longitude: lng },
                            radius: radius
                        }
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': this.apiKey,
                        'X-Goog-FieldMask': [
                            'places.id',
                            'places.displayName',
                            'places.types',
                            'places.primaryType',
                            'places.formattedAddress',
                            'places.location',
                            'places.rating',
                            'places.userRatingCount',
                            'places.priceLevel'
                        ].join(','),
                    },
                    timeout: 15000
                }
            );

            return (response.data.places || []).map(place => this.formatPlace(place));
        } catch (error) {
            const details = error.response?.data ? ` ${JSON.stringify(error.response.data)}` : '';
            console.error(`Failed to perform nearby search: ${error.message}${details}`);
            return [];
        }
    }

    // helper to format place data
    formatPlace(place) {
        const cuisine = this.extractCuisine(place.types || [], place.primaryType);

        return {
            googlePlaceId: place.id,
            name: place.displayName?.text || 'Unknown',
            cuisine: cuisine,
            address: place.formattedAddress || null,
            latitude: place.location?.latitude,
            longitude: place.location?.longitude,
            rating: place.rating || null,
            userRatingCount: place.userRatingCount || null,
            priceLevel: this.normalizePriceLevel(place.priceLevel),
            servesVegetarianFood: place.servesVegetarianFood || false,
            website: place.websiteUri || null
        };
    }


    // helper to extract cuisine from types
    // from https://developers.google.com/maps/documentation/places/web-service/place-types
    extractCuisine(types, primaryType) {
        const cuisineMapping = {
            'acai_shop': 'Acai',
            'afghani_restaurant': 'Afghani',
            'african_restaurant': 'African',
            'american_restaurant': 'American',
            'asian_restaurant': 'Asian',
            'brazilian_restaurant': 'Brazilian',
            'bagel_shop': 'Bagel',
            'bakery': 'Bakery',
            'bar': 'Bar',
            'bar_and_grill': 'Bar',
            'barbecue_restaurant': 'Barbecue',
            'breakfast_restaurant': 'Breakfast',
            'brunch_restaurant': 'Brunch',
            'buffet_restaurant': 'Buffet',
            'cafe': 'Cafe',
            'candy_store': 'Candy',
            'cat_cafe': 'Cat Cafe',
            'chinese_restaurant': 'Chinese',
            'chocolate_shop': 'Chocolate',
            'chocolate_shop': 'Chocolate',
            'coffee_shop': 'Coffee',
            'confectionery': 'Confectionery',
            'deli': 'Deli',
            'dessert_shop': 'Dessert',
            'dessert_restaurant': 'Dessert',
            'diner': 'Diner',
            'dog_cafe': 'Dog Cafe',
            'donut_shop': 'Donut',
            'fast_food_restaurant': 'Fast Food',
            'fine_dining_restaurant': 'Fine Dining',
            'food_court': 'Food Court',
            'french_restaurant': 'French',
            'greek_restaurant': 'Greek',
            'hamburger_restaurant': 'Hamburger',
            'ice_cream_shop': 'Ice Cream',
            'indian_restaurant': 'Indian',
            'indonesian_restaurant': 'Indonesian',
            'italian_restaurant': 'Italian',
            'japanese_restaurant': 'Japanese',
            'juice_shop': 'Juice Shop',
            'korean_restaurant': 'Korean',
            'lebanese_restaurant': 'Lebanese',
            'meal_delivery': 'Meal Delivery',
            'meal_takeaway': 'Meal Takeaway',
            'mediterranean_restaurant': 'Mediterranean',
            'mexican_restaurant': 'Mexican',
            'middle_eastern_restaurant': 'Middle Eastern',
            'pizza_restaurant': 'Pizza',
            'ramen_restaurant': 'Ramen',
            'sandwich_shop': 'Sandwiches',
            'seafood_restaurant': 'Seafood',
            'spanish_restaurant': 'Spanish',
            'steak_house': 'Steakhouse',
            'sushi_restaurant': 'Sushi',
            'tea_house': 'Tea House',
            'thai_restaurant': 'Thai',
            'turkish_restaurant': 'Turkish',
            'vegan_restaurant': 'Vegan',
            'vegetarian_restaurant': 'Vegetarian',
            'vietnamese_restaurant': 'Vietnamese',
            'wine_bar': 'Wine Bar'
        };

        if (primaryType && cuisineMapping[primaryType]) {
            return cuisineMapping[primaryType];
        }

        for (const type of types) {
            if (cuisineMapping[type]) {
                return cuisineMapping[type];
            }
        }

        return 'Restaurant';
    }

    // helper to format price level
    normalizePriceLevel(priceLevel) {
        const mapping = {
            'PRICE_LEVEL_FREE': 0,
            'PRICE_LEVEL_INEXPENSIVE': 1,
            'PRICE_LEVEL_MODERATE': 2,
            'PRICE_LEVEL_EXPENSIVE': 3,
            'PRICE_LEVEL_VERY_EXPENSIVE': 4
        };

        return mapping[priceLevel] !== undefined ? mapping[priceLevel] : 'Price level not available';
    }
}

module.exports = GooglePlacesAPI;