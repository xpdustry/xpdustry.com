import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants } from "node:zlib";

/**
 * Compresses the built scripts and styles once, as hard as Brotli goes, into `.br` files the
 * server sends as they are. Compressing while answering has to be quick, and quick is a seventh
 * larger: on a slow connection that is the difference this makes.
 */
const CLIENT = fileURLToPath(new URL("../dist/client", import.meta.url));
const TEXT = new Set([".js", ".css", ".svg", ".json", ".txt", ".xml"]);
/** Below this, the server sends a file as it is. */
const SMALLEST = 1024;

let files = 0;
let saved = 0;
for (const entry of readdirSync(CLIENT, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !TEXT.has(extname(entry.name))) continue;
  const path = join(entry.parentPath, entry.name);
  const source = readFileSync(path);
  if (source.length < SMALLEST) continue;
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
