import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import jest from "eslint-plugin-jest"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("vtex"), {
    languageOptions: {
        globals: {
            ...globals.jest,
            ...globals.node,
            metrics: true,
        },
        parserOptions: {
          project: true
        }
    },

    plugins: {
      jest
    },

    files: [
      "**/*.ts", "**/*.tsx",
      "**/*.js", "**/*.jsx",
    ],

    rules: {
        "prettier/prettier": "off",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-use-before-define": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-object-literal-type-assertion": "off",
        "@typescript-eslint/no-explicit-any": "off",
    },
}];
