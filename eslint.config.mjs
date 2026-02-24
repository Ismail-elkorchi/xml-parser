import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import boundaries from "eslint-plugin-boundaries";

export default [
  {
    ignores: ["dist/**", "reports/**", "node_modules/**", ".github/**/*.yml", ".github/**/*.yaml"]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.build.json"
      }
    },
    plugins: {
      import: importPlugin,
      boundaries
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.build.json"
        }
      },
      "boundaries/elements": [
        { type: "public", pattern: "src/public/**" },
        { type: "internal", pattern: "src/internal/**" }
      ]
    },
    rules: {
      "import/no-unresolved": "error",
      "import/no-duplicates": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ],
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: ["public"],
              allow: ["public", "internal"]
            },
            {
              from: ["internal"],
              allow: ["internal"]
            }
          ]
        }
      ]
    }
  },
  {
    files: ["scripts/**/*.mjs", "test/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        TextEncoder: "readonly",
        ReadableStream: "readonly"
      },
      parserOptions: {
        project: null
      }
    }
  }
];
