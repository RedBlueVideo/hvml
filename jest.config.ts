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