module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.base.json',
    },
  },
  moduleNameMapper: {
    '^@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/data$': '<rootDir>/libs/data/src/index.ts',
    '^@jjin-1c449209-ddd7-4aa4-8b41-8eae1ac2b47c/auth$': '<rootDir>/libs/auth/src/index.ts',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', 'apps/api-e2e'],
};
