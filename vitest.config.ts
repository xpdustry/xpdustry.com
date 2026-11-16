import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defaultServerConditions } from "vite";
import { defineConfig } from "vitest/config";
import { inlineScriptsPlugin } from "./scripts/inline-scripts.ts";
import { blogMarkdownPlugin } from "./src/blog/content/markdown.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // Node resolution: native packages hide behind the `browser` condition otherwise.
    conditions: [...defaultServerConditions]
  },
  plugins: [
    blogMarkdownPlugin(),
    inlineScriptsPlugin(),
    vanillaExtractPlugin({ identifiers: "debug" })
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.ts"],
          exclude: ["src/integration.test.ts", "src/hydration.test.ts"],
          css: { include: [/.+/] }
        }
      },
      {
        extends: true,
        test: {
          name: "artifact",
          environment: "node",
          include: ["src/integration.test.ts"]
        }
      },
      {
        extends: true,
        test: {
          name: "browser",
          environment: "node",
          include: ["src/hydration.test.ts"]
        }
      }
    ]
  }
});
