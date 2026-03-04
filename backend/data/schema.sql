-- Store the core authentication details
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- stores Google Places API restaurant data
CREATE TABLE IF NOT EXISTS restaurant_cache (
    google_place_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    rating REAL,
    user_ratings_total INTEGER DEFAULT 0,
    price_level INTEGER DEFAULT NULL,
    serves_vegetarian_food BOOLEAN DEFAULT FALSE,
    website TEXT,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- index for location queries
CREATE INDEX IF NOT EXISTS idx_restaurant_location
ON restaurant_cache (latitude, longitude);

-- index for dietary preference queries
CREATE INDEX IF NOT EXISTS idx_restaurant_dietary
ON restaurant_cache (serves_vegetarian_food, cuisine);