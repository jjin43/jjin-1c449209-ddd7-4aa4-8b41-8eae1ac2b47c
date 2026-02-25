module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  // Use the `transform` entry for ts-jest config (globals deprecation)
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.base.json', diagnostics: { warnOnly: true } }]
  },
  // Ignore compiled / cache outputs to avoid haste module collisions
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.nx/cache/'],
  moduleNameMapper: {
    '^@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/data$': '<rootDir>/libs/data/src/index.ts',
    '^@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth$': '<rootDir>/libs/auth/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'apps/api-e2e'],
};
