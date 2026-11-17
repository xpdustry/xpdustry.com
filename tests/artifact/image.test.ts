import { readdir, readFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { expect, test } from "vitest";

const root = new URL("../../", import.meta.url);
const read = (path: string) => readFile(new URL(path, root), "utf8");

test("the container image ships every file the production server imports", async () => {
  const shipped = [
    ...(await read("Dockerfile")).matchAll(/^COPY --from=build \S+ \/app\/(\S+)/gm)
  ].map(([, path]) => path!);
  const imported = [
    ...(await read("scripts/serve.ts")).matchAll(/(?:from|import\()\s*["'](\.[^"']+)["']/g)
  ].map(([, specifier]) =>
    new URL(specifier!, new URL("scripts/", root)).pathname.slice(root.pathname.length)
  );
  for (const path of imported) {
    expect(
      shipped.some((copied) => path === copied || path.startsWith(`${copied}/`)),
      `${path} is imported by scripts/serve.ts but not copied into the image`
    ).toBe(true);
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
  for (const source of [...bundle, "scripts/serve.ts", "scripts/compression.ts"]) {
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
