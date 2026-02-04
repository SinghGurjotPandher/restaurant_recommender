module.exports = {
    TestEnvironment: 'node',
    collectCoverageFrom: [
        'services/**/*.js',
        'routes/**/*.js',
        '!**/node_modules/**',
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/?(*.)+(spec|test).js',
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
};