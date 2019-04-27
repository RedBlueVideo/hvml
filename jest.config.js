module.exports = {
  "collectCoverage": false,
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
  // "transform": {
  //   "^.+\\.js$": "esm",
  // },
};
