import { readFile } from "node:fs/promises";
import { minify, transformWithOxc, type Plugin } from "vite";

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
      const { body } = this.parse(code);
      if (body.length !== 1 || body[0]!.type !== "FunctionDeclaration") {
        this.error(`${file} must hold only its default function, which runs alone in the page`);
      }
      const compact = await minify(file, code, { compress: false, mangle: true });
      return `export default ${JSON.stringify(compact.code)};`;
    }
  };
}
