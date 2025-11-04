const { createDefaultPreset } = require('ts-jest');

// Set NODE_ENV to test BEFORE anything else
process.env.NODE_ENV = 'test';

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    ...tsJestTransformCfg,
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/migrations/**',
    '!src/scripts/**',
    '!src/tests/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000, // 30 seconds for integration tests
  setupFiles: ['<rootDir>/src/tests/jest.setup.ts'], // Runs BEFORE test files are imported
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'], // Runs AFTER test framework is installed
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Suppress console.log during tests unless in debug mode
  silent: false,
  verbose: true,
};
