import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { blogMarkdownPlugin } from "./src/blog/content/markdown.ts";

export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    tsconfigPaths: true
  },
  // The footer's copyright year, the same on the server and in the browser, so it never mismatches
  // when the server outlives a new year.
  define: {
    "import.meta.env.BUILD_YEAR": JSON.stringify(new Date().getUTCFullYear())
  },
  plugins: [
    blogMarkdownPlugin(),
    vanillaExtractPlugin(),
    tanstackStart({
      importProtection: {
        client: { files: ["**/*.server.*", "**/src/*/server/**"] }
      }
    }),
    // TanStack Start requires its plugin before React's.
    viteReact()
  ],
  build: {
    sourcemap: true,
    assetsInlineLimit: 0
  }
});
