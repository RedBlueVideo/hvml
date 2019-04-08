module.exports = {
  "collectCoverage": true,
  "coverageReporters": [
    "json-summary",
    "text",
    "lcov",
  ],
  "coveragePathIgnorePatterns": [
    "node_modules/",
    "package.json",
    ".eslintrc.js",
    "jest.config.js",
  ],
};
