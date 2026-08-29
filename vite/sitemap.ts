import { readdir } from "node:fs/promises";
import { Readable } from "node:stream";
import { ErrorLevel, SitemapStream, streamToPromise } from "sitemap";
import type { Plugin } from "vite";

interface SitemapPluginOptions {
  hostname: string;
  routes: () => Promise<readonly string[]>;
}

export function sitemapPlugin(options: SitemapPluginOptions): Plugin {
  return {
    name: "xpdustry:sitemap",
    apply: "build",
    applyToEnvironment: (environment) => environment.name === "client",
    async generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: await generateSitemapXml(options.hostname, await options.routes()),
      });
    },
  };
}

export async function blogRoutes(directory: URL): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => `/blog/${entry.name.slice(0, -".md".length)}`)
    .sort();
}

export async function generateSitemapXml(
  hostname: string,
  routes: readonly string[],
): Promise<string> {
  const stream = new SitemapStream({
    hostname,
    level: ErrorLevel.THROW,
    xmlns: { news: false, xhtml: false, image: false, video: false },
  });
  const items = routes.map((url) => ({ url }));
  const sitemap = await streamToPromise(Readable.from(items).pipe(stream));
  return sitemap.toString();
}
