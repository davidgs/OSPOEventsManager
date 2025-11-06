/* The MIT License (MIT)
 *
 * Copyright (c) 2022-present David G. Simmons
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
          "TSInterfaceDeclaration[id.name=/^(Asset|Event|User|CfpSubmission|Attendee)$/]",
        message:
          "Do not define custom database types. Import from @shared/schema instead.",
      },
      {
        selector:
          "TSTypeAliasDeclaration[id.name=/^(Asset|Event|User|CfpSubmission|Attendee)$/]",
        message:
          "Do not define custom database types. Import from @shared/schema instead.",
      },
    ],
    // Prevent accessing camelCase properties that should be snake_case
    "no-restricted-properties": [
      "error",
      {
        object: "*",
        property: "fileSize",
        message: "Use file_size instead of fileSize (database uses snake_case)",
      },
      {
        object: "*",
        property: "mimeType",
        message: "Use mime_type instead of mimeType (database uses snake_case)",
      },
      {
        object: "*",
        property: "filePath",
        message: "Use file_path instead of filePath (database uses snake_case)",
      },
      {
        object: "*",
        property: "uploadedBy",
        message:
          "Use uploaded_by instead of uploadedBy (database uses snake_case)",
      },
      {
        object: "*",
        property: "uploadedAt",
        message:
          "Use uploaded_at instead of uploadedAt (database uses snake_case)",
      },
      {
        object: "*",
        property: "eventId",
        message: "Use event_id instead of eventId (database uses snake_case)",
      },
      {
        object: "*",
        property: "cfpSubmissionId",
        message:
          "Use cfp_submission_id instead of cfpSubmissionId (database uses snake_case)",
      },
    ],
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};
