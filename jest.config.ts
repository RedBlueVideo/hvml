import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  "collectCoverage": true,
  "coverageReporters": [
    "json-summary",
    "text",
    "lcov",
  ],
  "transformIgnorePatterns": ['node_modules/(?!(sucrase)/)'],
  "transform": {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  /**
   * Source uses NodeNext-style explicit `.js` specifiers; map them back
   * to the on-disk `.ts` files for jest's resolver.
   */
  "moduleNameMapper": {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  "coveragePathIgnorePatterns": [
    "node_modules/",
    "dist/",
    "package.json",
    ".eslintrc.js",
    "jest.config.js",
  ],
  "modulePathIgnorePatterns": [
    "dist/",
  ],
};

export default config;