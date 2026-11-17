import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants } from "node:zlib";

const CLIENT = fileURLToPath(new URL("../dist/client", import.meta.url));
const TEXT_EXTENSIONS = new Set([".js", ".css", ".svg", ".json", ".txt", ".xml"]);
const SMALLEST_WORTH_COMPRESSING = 1024;

let files = 0;
let saved = 0;
for (const entry of readdirSync(CLIENT, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !TEXT_EXTENSIONS.has(extname(entry.name))) continue;
  const path = join(entry.parentPath, entry.name);
  const source = readFileSync(path);
  if (source.length < SMALLEST_WORTH_COMPRESSING) continue;
  const compressed = brotliCompressSync(source, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_SIZE_HINT]: source.length
    }
  });
  if (compressed.length >= source.length) continue;
  writeFileSync(`${path}.br`, compressed);
  files++;
  saved += source.length - compressed.length;
}
console.log(`precompressed ${files} files, ${Math.round(saved / 1024)} kB smaller`);
