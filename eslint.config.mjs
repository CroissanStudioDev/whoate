import { defineConfig } from "eslint/config";
import core from "ultracite/eslint/core";
import react from "ultracite/eslint/react";
import next from "ultracite/eslint/next";

export default defineConfig([
  {
    extends: [core, react, next],
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
]);
