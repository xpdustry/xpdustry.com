import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { redact } from "@tanstack/redact/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { inlineScriptsPlugin } from "./scripts/inline-scripts.ts";
import { blogMarkdownPlugin } from "./src/blog/content/markdown.ts";

const NATIVE_PACKAGES = ["@takumi-rs/core"];

export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    tsconfigPaths: true
  },
  define: {
    "import.meta.env.BUILD_YEAR": JSON.stringify(new Date().getUTCFullYear())
  },
  plugins: [
    blogMarkdownPlugin(),
    inlineScriptsPlugin(),
    vanillaExtractPlugin(),
    tanstackStart({
      importProtection: {
        client: { files: ["**/*.server.*", "**/src/*/server/**"] }
      }
    }),
    viteReact(),
    redact()
  ],
  // Redact swaps React in through Vite's resolver, which never sees an external package's imports.
  ssr: { noExternal: true, external: NATIVE_PACKAGES },
  build: {
    sourcemap: true,
    assetsInlineLimit: 0
  }
});
