process.env.TZ = 'Asia/Ulaanbaatar';

module.exports = {
  preset: 'jest-expo',
  watchman: false,
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@react-native/assets-registry/(.*)$': '<rootDir>/node_modules/@react-native/assets-registry/$1',
    '^@tasky/core$': '<rootDir>/../../packages/core/src/index.ts',
    '^react-native-reanimated/mock$': '<rootDir>/__tests__/test-utils/reanimated-mock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:.pnpm/)?((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@tasky/sdk|react-native-worklets|react-native-reanimated))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/future/**',
    '!src/app/**/_layout.tsx',
    '!src/app/_layout.tsx',
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 55,
      branches: 55,
      statements: 60,
    },
  },
};
