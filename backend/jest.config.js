module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**',
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/?(*.)+(spec|test).js',
    ]
};