import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { blogMarkdownPlugin } from "./vite/markdown.ts";

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    blogMarkdownPlugin(),
    vanillaExtractPlugin(),
    tanstackStart({
      importProtection: {
        // Everything under src/server polls, opens sockets or holds secrets.
        client: { files: ["**/*.server.*", "**/src/server/**"] },
      },
    }),
    // React's plugin must come after Start's.
    viteReact(),
  ],
  build: {
    sourcemap: true,
    // no images inlined as data URIs: the page is server-rendered, so each would ship twice, in
    // the HTML and in the JavaScript, instead of once as a file every page shares from the cache
    assetsInlineLimit: 0,
  },
});
