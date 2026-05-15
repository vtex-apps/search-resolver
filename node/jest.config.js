module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  // collectCoverageFrom: undefined,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of regexp pattern strings used to skip coverage collection
  // coveragePathIgnorePatterns: [
  //   "/node_modules/"
  // ],

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testRegex: '(.*(test|spec)).ts?$',
  testEnvironment: 'node',

  // managed-by: golden-path v1
  // Thresholds pinned a hair below the current baseline so CI is a
  // ratchet rather than a blocker. Re-measure with `yarn test --coverage`
  // and bump these up whenever tests are added; target is 60/60/60/70
  // (lines / functions / statements / branches).
  coverageThreshold: {
    global: {
      lines: 60,
      statements: 60,
      functions: 35,
      branches: 70,
    },
  },
}
