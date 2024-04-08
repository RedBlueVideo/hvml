export default {
  "testEnvironment": "jest-environment-node",
  "transform": {},
  "collectCoverage": true,
  "coverageReporters": [
    "json-summary",
    "text",
    "lcov",
  ],
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
