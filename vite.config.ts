import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { blogMarkdownPlugin } from "./vite/markdown.ts";

export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    tsconfigPaths: true
  },
  plugins: [
    blogMarkdownPlugin(),
    vanillaExtractPlugin(),
    tanstackStart({
      importProtection: {
        client: { files: ["**/*.server.*", "**/src/server/**", "**/src/*/server/**"] }
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
