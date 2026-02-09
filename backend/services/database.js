const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');


const dbPath = path.resolve(__dirname, '../data/restaurants.db');
const schemaPath = path.resolve(__dirname, '../data/schema.sql');

// Create or open the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
        initDB();
    }
});

// Initialize the database with the schema
function initDB() {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('Error initializing schema:', err);
        } else {
            console.log('Database schema initialized');
        }
    });
}

// Wrapper to make database queries use Promises (async/await)
function query(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

module.exports = { db, query, run };