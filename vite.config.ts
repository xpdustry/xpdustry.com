import tailwindcss from "@tailwindcss/vite";
import { routePathFromFile } from "filesystem-routing";
import { fileRoutes } from "filesystem-routing/vite";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { blogMarkdownPlugin } from "./vite/markdown.ts";

// `/styleguide` is a visual regression fixture, not a page. Dropping it from
// the route scan (rather than 404ing inside the component) keeps its fixtures
// out of the production bundle entirely.
const devOnlyRoutes = ["/styleguide"];

export default defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },
  css: {
    devSourcemap: true,
  },
  plugins: [
    tailwindcss(),
    blogMarkdownPlugin(),
    // `extensions` makes vite-plugin-solid also compile the `?pick=` route
    // modules the fileRoutes plugin emits because their ids end in a query
    // string rather than a normal source extension.
    solid({
      start: { middleware: "src/server/middleware.ts" },
      ssr: true,
      extensions: [".jsx", ".tsx"],
    }),
    // vite-plugin-solid pins the SSR bundle to `server.js`, which collides
    // with the authored Node entry added below and pushes one of them to an
    // order-dependent `server2.js`. A later plugin's config wins the merge,
    // so naming both entries after their input key is stated here.
    {
      name: "xpdustry:ssr-entry-names",
      config: () => ({
        environments: {
          ssr: {
            build: {
              rollupOptions: { output: { entryFileNames: "[name].js" } },
            },
          },
        },
      }),
    },
    fileRoutes({
      httpMethods: true,
      // Ten pages of mostly-static content: the per-chunk overhead of
      // splitting costs more than it saves, and eager route modules render
      // inside the SSR shell pass, which is what lets the 404 route set a
      // real 404 status before the head is committed.
      codeSplitting: false,
      toPath: (routeFile) => {
        const path = routePathFromFile(routeFile);
        if (mode === "production" && devOnlyRoutes.includes(path)) return undefined;
        return path;
      },
    }),
  ],
  server: {
    port: 3000,
  },
  environments: {
    ssr: {
      build: {
        rollupOptions: {
          // The authored Node entry ships alongside the generated SSR handler
          // so both live in one module graph: the runtime that owns the
          // pollers and the renderer that reads their snapshots are then the
          // same module instances, not two copies behind separate bundles.
          input: {
            node: "src/server/node.ts",
          },
        },
      },
    },
  },
  test: {
    globals: false,
    setupFiles: ["./vitest-setup.ts"],
    isolate: false,
    // Server modules get plain Node; component tests get a DOM. Two projects
    // rather than one environment per glob, because vitest 4 dropped
    // environmentMatchGlobs.
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["src/{server,content,lib}/**/*.test.{ts,tsx}", "vite/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          environment: "jsdom",
          include: ["src/components/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
  build: {
    target: "esnext",
    sourcemap: true,
    // Keep images as asset files instead of inlining them into the JS bundle.
    assetsInlineLimit: 0,
  },
}));
