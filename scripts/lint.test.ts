import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, expect, test } from "vitest";

const repository = fileURLToPath(new URL("../", import.meta.url));
const EM_DASH = String.fromCodePoint(0x2014);
const EN_DASH = String.fromCodePoint(0x2013);

const folders: string[] = [];
afterAll(() => {
  for (const folder of folders) rmSync(folder, { recursive: true, force: true });
});

function fixtures(files: Record<string, string>): string {
  const folder = mkdtempSync(join(tmpdir(), "xpdustry-lint-"));
  folders.push(folder);
  for (const [name, content] of Object.entries(files)) writeFileSync(join(folder, name), content);
  return folder;
}

/** What `pnpm lint` reports for one file: each problem's line and rule. */
function oxlint(name: string, lines: string[]) {
  const run = spawnSync(
    join(repository, "node_modules/.bin/oxlint"),
    ["-c", join(repository, ".oxlintrc.json"), "--type-aware", "--deny-warnings", name],
    { cwd: fixtures({ [name]: lines.join("\n") }), encoding: "utf8" }
  );
  return [...run.stdout.matchAll(/:(\d+):\d+: \w+ xpdustry\(([\w-]+)\)/g)].map(
    ([, line, rule]) => `${line} ${rule}`
  );
}

test("keeps hover styles to devices that hover", () => {
  expect(
    oxlint("Hovers.css.ts", [
      'export const bare = style({ selectors: { "&:hover": { opacity: 1 } } });',
      'globalStyle(".link:hover", { color: "red" });',
      'export const guarded = style({ "@media": { [media.hover]: { selectors: { "&:hover": { opacity: 1 } } } } });',
      'globalStyle(".link:hover", { "@media": { [media.hover]: { color: "red" } } });',
      'export const combined = style({ "@media": { [`${media.motion} and ${media.hover}`]: { selectors: { "&:hover": { opacity: 1 } } } } });'
    ])
  ).toEqual(["1 hover-needs-hover-media", "2 hover-needs-hover-media"]);
});

test("refuses a transition of everything or of the layout, wherever the word stands", () => {
  expect(
    oxlint("Moves.css.ts", [
      'const GROW = "--grow";',
      'export const all = { transition: "all 0.2s" };',
      'export const late = { transition: "opacity 0.2s, ease 150ms width" };',
      'export const property = { transitionProperty: "height" };',
      "export const painted = { transition: `150ms opacity, translate 0.3s cubic-bezier(0.2, 1, 0.3, 1)` };",
      "export const variable = { transition: `${GROW} 0.6s ease-in-out` };"
    ])
  ).toEqual(["2 no-layout-transition", "3 no-layout-transition", "4 no-layout-transition"]);
});

test("lint-text refuses dashes in any text file git keeps, and leaves alone what it ignores", () => {
  const folder = fixtures({
    ".gitignore": "built.js\n",
    "built.js": `// ${EM_DASH}\n`,
    "post.md": `# Title\n\nOne ${EM_DASH} two\n`,
    "data.json": `{ "range": "1${EN_DASH}2" }\n`,
    "clean.ts": "export const range = '1-2';\n"
  });
  spawnSync("git", ["init", "--quiet"], { cwd: folder });
  const run = spawnSync(process.execPath, [join(repository, "scripts/lint-text.ts")], {
    cwd: folder,
    encoding: "utf8"
  });
  expect(run.status).toBe(1);
  expect(run.stderr.split("\n").filter((line) => /^\S+:\d+:/.test(line))).toEqual([
    `data.json:1: { "range": "1${EN_DASH}2" }`,
    `post.md:3: One ${EM_DASH} two`
  ]);
});
