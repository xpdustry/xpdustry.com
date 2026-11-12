import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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
  },
});
