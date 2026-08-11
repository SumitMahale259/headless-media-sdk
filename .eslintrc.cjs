/**
 * Enforces the dependency-direction constraints from the task spec at lint
 * time, not just by convention:
 *   app -> wrappers -> core        (app -> media-react -> media-core)
 *   app -> components              (app -> media-ui-react)
 *   media-ui-react must NEVER import media-core or media-react
 *   media-core must NEVER import React / media-react / media-ui-react
 */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  overrides: [
    {
      files: ["packages/media-core/src/**/*.ts"],
      rules: {
        "no-restricted-imports": [
          "error",
          { patterns: ["react", "react-native", "media-react", "media-ui-react"] },
        ],
      },
    },
    {
      files: ["packages/media-ui-react/src/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          { patterns: ["media-core", "media-react"] },
        ],
      },
    },
    {
      files: ["packages/media-react/src/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "error",
          { patterns: ["media-ui-react"] },
        ],
      },
    },
  ],
};
