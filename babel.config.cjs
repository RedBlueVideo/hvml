module.exports = {
  "presets": [
    ['@babel/preset-env', { "targets": { "node": 'current' } }],
    // allowDeclareFields: `declare` class fields are type-only —
    // matching tsc — instead of a parse error
    ['@babel/preset-typescript', { "allowDeclareFields": true }],
  ],
  "plugins": [
    "babel-plugin-transform-import-meta",
  ],
};
