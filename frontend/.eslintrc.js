/* eslint-disable no-undef */
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  ignorePatterns: ["*.config.js", "out/_next"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:@next/next/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "jsx-a11y"],
  rules: {
    "linebreak-style": ["error", "unix"],
    quotes: [
      "error",
      "double",
      {
        avoidEscape: true,
      },
    ],
    semi: ["error", "always"],
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "@typescript-eslint/no-unused-vars": [
      "error",
      { varsIgnorePattern: "^_.*", argsIgnorePattern: "^_.*" },
    ],
    // We use tabIndex to control focus in correct ways in some places. No need
    // to warn about it.
    "jsx-a11y/no-noninteractive-tabindex": 0,
    // The only media we display is videos and audio loaded for previews. We
    // can't display captions for those, we don't have any control over the
    // files.
    "jsx-a11y/media-has-caption": 0,
    "jsx-a11y/no-noninteractive-element-interactions": 0,
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
