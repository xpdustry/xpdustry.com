import { defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";
import { blogMarkdownPlugin } from "./vite/markdown.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Node resolution: native packages hide behind the `browser` condition otherwise.
    conditions: [...defaultServerConditions],
  },
  plugins: [blogMarkdownPlugin()],
  css: {
    // readable class names, so tests can assert on them
    modules: { generateScopedName: "[local]" },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}", "vite/**/*.test.{ts,tsx}"],
          exclude: ["src/server/integration.test.ts"],
          css: { include: [/.+/] },
        },
      },
      {
        extends: true,
        test: {
          name: "artifact",
          environment: "node",
          include: ["src/server/integration.test.ts"],
        },
      },
    ],
  },
});
