module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/unit/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { types: ['jest'] } }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
};
