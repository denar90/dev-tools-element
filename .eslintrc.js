module.exports = {
  "extends": ["eslint:recommended"],
  "env": {
    "browser": true,
    "es6": true,
  },
  "globals": {
    Bindings: true,
    Common: true,
    PerfUI: true,
    Runtime: true,
    SyncView: true,
    Timeline: true,
    UI: true
  },
  "rules": {
    // 2 == error, 1 == warning, 0 == off
    "indent": [2, 2, {
      "SwitchCase": 1,
      "VariableDeclarator": 2
    }],
    "max-len": [1, 120, {
      "ignoreComments": true,
      "ignoreUrls": true,
      "tabWidth": 2
    }],
    "no-empty": [2, {
      "allowEmptyCatch": true
    }],
    "no-implicit-coercion": [2, {
      "boolean": false,
      "number": true,
      "string": true
    }],
    "no-unused-expressions": [1, {
      "allowShortCircuit": true,
      "allowTernary": false
    }],
    "no-unused-vars": [2, {
      "vars": "all",
      "args": "after-used"
    }],
    "no-console": 0,
    "quotes": [2, "single"],
    "strict": [2, "global"],
    "prefer-const": 2
  },
  "parserOptions": {
    "sourceType": "module"
  }
};
