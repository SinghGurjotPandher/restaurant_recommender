-- Store the core authentication details
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores per-user cuisine search history for smart recommendations
CREATE TABLE IF NOT EXISTS user_cuisine_preferences (
    user_id INTEGER NOT NULL,
    cuisine TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, cuisine),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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