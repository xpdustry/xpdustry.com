import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { defineConfig } from "vitest/config";
import { inlineScriptsPlugin } from "./scripts/inline-scripts.ts";
import { blogMarkdownPlugin } from "./src/blog/content/markdown.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true
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
          css: { include: [/.+/] }
        }
      },
      {
        extends: true,
        test: {
          name: "artifact",
          environment: "node",
          include: ["tests/artifact/**/*.test.ts"],
          globalSetup: ["tests/artifact/serve.setup.ts"]
        }
      }
    ]
  }
});
