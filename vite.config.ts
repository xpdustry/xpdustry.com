import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { routePathFromFile } from "filesystem-routing";
import { fileRoutes } from "filesystem-routing/vite";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
// Native package import maps resolve these while Vite is still loading its config.
import { rehypeCodeChrome } from "#build/rehype-code-chrome.ts";
import { rehypeHeadingAnchors } from "#build/rehype-heading-anchors.ts";

// `/styleguide` is a visual regression fixture, not a page. Dropping it from
// the route scan (rather than 404ing inside the component) keeps its fixtures
// out of the production bundle entirely.
const devOnlyRoutes = ["/styleguide"];

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "#app": fileURLToPath(new URL("./src", import.meta.url)),
      "#build": fileURLToPath(new URL("./build", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    // MDX runs before the Solid plugin and hands off JSX rather than
    // `jsx()` calls (`jsx: true`), so Solid's own compiler produces the
    // output. Setting a `jsxImportSource` here instead would pull a second
    // runtime into the bundle alongside the one the app already uses.
    {
      enforce: "pre" as const,
      ...mdx({
        jsx: true,
        // Solid reads `class` and CSS-cased style properties. Left on the
        // React defaults, MDX emits `className`, which Solid passes through
        // as a literal attribute and every generated class silently misses.
        elementAttributeNameCase: "html",
        stylePropertyNameCase: "css",
        remarkPlugins: [
          remarkFrontmatter,
          [remarkMdxFrontmatter, { name: "frontmatter" }],
          remarkGfm,
        ],
        rehypePlugins: [rehypeSlug, rehypeHeadingAnchors, rehypeCodeChrome],
      }),
    },
    // `extensions` makes vite-plugin-solid also compile the `?pick=` route
    // modules the fileRoutes plugin emits (their ids end in a query string),
    // and the JSX that @mdx-js/rollup produces for `.mdx` sources.
    solid({
      start: { middleware: "src/server/middleware.ts" },
      ssr: true,
      extensions: [".jsx", ".tsx", ".mdx"],
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
          include: ["src/{server,content,lib}/**/*.test.{ts,tsx}"],
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
import { fileURLToPath, URL } from "node:url";
