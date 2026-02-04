CREATE TABLE restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    price_level INTEGER NOT NULL,
    rating REAL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    phone TEXT,
    hours TEXT,
    dietary_options TEXT,  -- ONLY ['vegetarian', 'vegan']
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- cache for API responses
CREATE TABLE restaurant_cache (
    place_id TEXT PRIMARY KEY,
    data TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);