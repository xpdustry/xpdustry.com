import { readFile } from "node:fs/promises";
import { minify, transformWithOxc, type Plugin } from "vite";

/**
 * A standalone function's source must be identical in both bundles: Function.toString() differs
 * after client minification. Compile these raw imports before bundling, keeping the result a string.
 * The files export only their default function, with no runtime imports or module-level values.
 */
export function inlineScriptsPlugin(): Plugin {
  return {
    name: "xpdustry:inline-scripts",
    enforce: "pre",
    async load(id) {
      if (!id.endsWith(".script.ts?raw")) return;
      const file = id.slice(0, -"?raw".length);
      this.addWatchFile(file);
      const source = (await readFile(file, "utf8")).replace("export default ", "");
      const { code } = await transformWithOxc(source, file, { sourcemap: false });
      const compact = await minify(file, code, { compress: false, mangle: true });
      return `export default ${JSON.stringify(compact.code)};`;
    }
  };
}
