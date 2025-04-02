/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    // Allow require() imports
    'no-undef': 'off' // Node.js global variables like require
  }
};
