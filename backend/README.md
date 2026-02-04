# Backend Documentation

We implement using TDD, specifically using **Jest** as the main unit test module.

## Completed Functionality:

[ x ] `distance.js`: Haversine Distance helper function
[ x ] `scoring.js` : Scoring function based on user preferences and restaurant match

## Unit Tests:

- `distance.js`: run using `npx jest tests/utils/distance.test.js`
- `scoring.js` run using `npx jest tests/services/scoring.test.js`

## Databases:

- `restaurants`: schema found within `data/schema.sql`
  - id INTEGER PRIMARY KEY AUTOINCREMENT,
  - name TEXT NOT NULL,
  - cuisine TEXT NOT NULL,
  - price_level INTEGER NOT NULL,
  - rating REAL,
  - latitude REAL NOT NULL,
  - longitude REAL NOT NULL,
  - address TEXT,
  - phone TEXT,
  - hours TEXT,
  - dietary_options TEXT, -- e.g. ['vegetarian', 'vegan', 'gluten-free']
  - allergens TEXT, -- e.g. ['nuts', 'dairy']
  - created_at DATETIME DEFAULT CURRENT_TIMESTAMP
