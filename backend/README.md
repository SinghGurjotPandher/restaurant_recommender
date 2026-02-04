# Backend Documentation

We implement using TDD, specifically using **Jest** as the main unit test module.
That means, for each of the "completed functions" below, its unit test has been successfully ran.

## Completed Functionality:

[ x ] `distance.js` : Haversine Distance helper function
[ x ] `scoring.js` : Scoring function based on user preferences and restaurant match
[ x ] `googlePlaces.js` : External API call to Google Places API -> populate database
[ x ] `schema.sql` : Schema storing the cached metadata of restaurants

## Unit Tests:

- `distance.js`: run using `npx jest tests/utils/distance.test.js`
- `scoring.js`: run using `npx jest tests/services/scoring.test.js`
- `googlePlaces.js`: run using `npx jest tests/services/googlePlaces.test.js`

## Databases:

- `restaurant_cache`: stores cached restaurants extracted from Google Places API
  - google_place_id TEXT PRIMARY KEY,
  - name TEXT NOT NULL,
  - cuisine TEXT NOT NULL,
  - address TEXT,
  - latitude REAL NOT NULL,
  - longitude REAL NOT NULL,
  - rating REAL,
  - user_ratings_total INTEGER DEFAULT 0,
  - price_level INTEGER DEFAULT NULL,
  - serves_vegetarian_food BOOLEAN DEFAULT FALSE,
  - website TEXT,
  - cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  - expires_at DATETIME
