module.exports = {
  extends: [
    "@eslint/js",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    // Prevent defining types that should come from shared schema
    "@typescript-eslint/no-redeclare": "error",
    // Custom rules to prevent type mismatches
    "no-restricted-syntax": [
      "error",
      {
        selector:
          "TSInterfaceDeclaration[id.name=/^(Event|User|Asset|CFPSubmission|Attendee|Sponsorship|Stakeholder)$/]",
        message:
          "Do not define database entity types locally. Import them from @shared/schema instead.",
      },
      {
        selector:
          "TSTypeAliasDeclaration[id.name=/^(Event|User|Asset|CFPSubmission|Attendee|Sponsorship|Stakeholder)$/]",
        message:
          "Do not define database entity types locally. Import them from @shared/schema instead.",
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
