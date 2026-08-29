import { vanillaExtractPlugin } from "@vanilla-extract/vite-plugin";
import { routePathFromFile } from "filesystem-routing";
import { fileRoutes } from "filesystem-routing/vite";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import { SITE } from "./src/data/site.ts";
import { blogMarkdownPlugin } from "./vite/markdown.ts";
import { blogRoutes, sitemapPlugin } from "./vite/sitemap.ts";

// The styleguide is a development-only visual fixture.
const devOnlyRoutes = ["/styleguide"];

export default defineConfig(({ mode }) => {
  return {
    resolve: {
      tsconfigPaths: true,
    },
    css: {
      devSourcemap: true,
    },
    plugins: [
      ...vanillaExtractPlugin(),
      {
        name: "xpdustry:vanilla-extract-hmr",
        handleHotUpdate({ file, server }) {
          if (!file.endsWith(".css.ts")) return;
          server.ws.send({ type: "full-reload" });
          return [];
        },
      },
      blogMarkdownPlugin(),
      sitemapPlugin({
        hostname: SITE.origin,
        routes: async () => [
          "/",
          "/blog",
          ...(await blogRoutes(new URL("./src/content/blog/", import.meta.url))),
        ],
      }),
      // fileRoutes emits ?pick= module IDs, so Solid must compile TSX query modules.
      solid({
        start: {
          middleware: "src/server/middleware.ts",
          env: "src/config/env.ts",
        },
        ssr: true,
        extensions: [".jsx", ".tsx"],
      }),
      // Name both SSR entries explicitly to avoid vite-plugin-solid's server.js collision.
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
        // Eager routes let the catch-all set the HTTP status during SSR.
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
            // Bundle the Node entry with SSR so the renderer shares its status runtime.
            input: {
              node: "src/server/node.ts",
            },
            onwarn(warning, warn) {
              // This dynamic import keeps the Node runtime out of the client bundle.
              if (
                warning.code === "INEFFECTIVE_DYNAMIC_IMPORT" &&
                warning.message.includes("src/server/runtime.ts") &&
                warning.message.includes("src/data/queries.ts")
              ) {
                return;
              }
              warn(warning);
            },
          },
        },
      },
    },
    test: {
      globals: false,
      setupFiles: ["./vitest-setup.ts"],
      isolate: true,
      projects: [
        {
          extends: true,
          test: {
            name: "server",
            environment: "node",
            include: [
              "src/{config,content,data,lib,server}/**/*.test.{ts,tsx}",
              "vite/**/*.test.ts",
            ],
            exclude: ["src/server/integration.test.ts"],
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
        {
          extends: true,
          test: {
            name: "artifact",
            environment: "node",
            include: ["src/server/integration.test.ts"],
          },
        },
        {
          extends: true,
          test: {
            name: "hydration",
            environment: "jsdom",
            include: ["src/hydration.test.ts"],
          },
        },
      ],
    },
    build: {
      target: "esnext",
      sourcemap: true,
      assetsInlineLimit: 0,
    },
  };
});
