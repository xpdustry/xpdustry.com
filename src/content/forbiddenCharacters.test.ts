import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ignore from "ignore";
import { expect, test } from "vitest";

/** En dash, em dash and horizontal bar, by code point so this file does not contain them. */
const FORBIDDEN = new RegExp(`[${String.fromCodePoint(0x2013, 0x2014, 0x2015)}]`);
const TEXT = /\.(?:[cm]?[jt]sx?|json|md|ya?ml|css|html|txt|xml|svg|webmanifest)$/;

const root = fileURLToPath(new URL("../../", import.meta.url));

const ignored = ignore().add(".git");
for (const rules of [".gitignore", ".git/info/exclude"]) {
  if (existsSync(root + rules)) ignored.add(readFileSync(root + rules, "utf8"));
}

function textFiles(folder: string): string[] {
  return readdirSync(root + folder, { withFileTypes: true }).flatMap((entry) => {
    const path = folder + entry.name;
    if (entry.isDirectory()) return ignored.ignores(`${path}/`) ? [] : textFiles(`${path}/`);
    return entry.isFile() && TEXT.test(entry.name) && !ignored.ignores(path) ? [path] : [];
  });
}

test("no en dash or em dash anywhere in the repository", () => {
  const found = textFiles("").flatMap((file) =>
    readFileSync(root + file, "utf8")
      .split("\n")
      .flatMap((line, index) =>
        FORBIDDEN.test(line) ? [`${file}:${index + 1}: ${line.trim()}`] : [],
      ),
  );
  expect(found).toEqual([]);
});
