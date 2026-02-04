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
    dietary_options TEXT,  -- e.g. ['vegetarian', 'vegan', 'gluten-free']
    allergens TEXT,        -- e.g. ['nuts', 'dairy']
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);