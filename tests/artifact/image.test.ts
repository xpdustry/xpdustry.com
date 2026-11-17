import { readdir, readFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { expect, test } from "vitest";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");

const SERVER = "scripts/server";
const serverFiles = async () =>
  (await readdir(new URL(SERVER, root)))
    .filter((file) => !file.endsWith(".test.ts"))
    .map((file) => `${SERVER}/${file}`);

test("the production server imports no file from outside the folder the image ships", async () => {
  expect(await read("Dockerfile")).toContain(`/app/${SERVER} ./${SERVER}`);
  for (const file of await serverFiles()) {
    const relative = [...(await read(file)).matchAll(/(?:from|import\()\s*["'](\.[^"']+)["']/g)];
    for (const [, specifier] of relative) expect(specifier, file).toMatch(/^\.\/[^/]+$/);
  }
});

const TOP_LEVEL_IMPORT =
  /^(?:import|export)\b(?:[^;"']*?\bfrom)?\s*["']([^"'./][^"']*)["']|\bimport\(\s*["']([^"'./][^"']*)["']\s*\)/gm;

const packageOf = (specifier: string) =>
  specifier
    .split("/")
    .slice(0, specifier.startsWith("@") ? 2 : 1)
    .join("/");

test("the production server imports only what the image installs: runtime dependencies", async () => {
  const { dependencies } = JSON.parse(await read("package.json")) as {
    dependencies: Record<string, string>;
  };
  const bundle = (await readdir(new URL("dist/server/", root), { recursive: true }))
    .filter((file) => file.endsWith(".js"))
    .map((file) => `dist/server/${file}`);
  const packages = new Set<string>();
  for (const source of [...bundle, ...(await serverFiles())]) {
    for (const [, statement, dynamic] of (await read(source)).matchAll(TOP_LEVEL_IMPORT)) {
      const specifier = (statement ?? dynamic)!;
      if (!isBuiltin(specifier)) packages.add(packageOf(specifier));
    }
  }
  expect(packages.size).toBeGreaterThan(0);
  for (const name of packages) {
    expect(dependencies, `${name} is imported at runtime but only a dev dependency`).toHaveProperty(
      [name]
    );
  }
});
