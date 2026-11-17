import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPOSITORY = fileURLToPath(new URL("../../", import.meta.url));

const BUILD_INPUTS = [
  "src",
  "public",
  "scripts",
  "package.json",
  "pnpm-lock.yaml",
  "vite.config.ts",
  "tsconfig.json",
  "gt.config.json"
];
const BUILT_SERVER = join(REPOSITORY, "dist/server/server.js");
const BUILT_FROM = join(REPOSITORY, "dist/source.sha256");

function filesOf(input: string): string[] {
  const stats = statSync(join(REPOSITORY, input), { throwIfNoEntry: false });
  if (!stats) return [];
  if (!stats.isDirectory()) return [input];
  return readdirSync(join(REPOSITORY, input), { recursive: true, encoding: "utf8" })
    .map((name) => join(input, name))
    .filter((file) => statSync(join(REPOSITORY, file)).isFile());
}

export function sourceFingerprint(): string {
  const digest = createHash("sha256");
  for (const file of BUILD_INPUTS.flatMap(filesOf).sort()) {
    digest
      .update(`${file}\0`)
      .update(readFileSync(join(REPOSITORY, file)))
      .update("\n");
  }
  return digest.digest("hex").slice(0, 16);
}

function builtFingerprint(): string | undefined {
  const built = statSync(BUILT_SERVER, { throwIfNoEntry: false });
  const recorded = statSync(BUILT_FROM, { throwIfNoEntry: false });
  const builtSinceRecorded = built && recorded && built.mtimeMs > recorded.mtimeMs;
  if (!built || !recorded || builtSinceRecorded) return undefined;
  return readFileSync(BUILT_FROM, "utf8");
}

export class BuildFailed extends Error {}

export function ensureBuild(): void {
  const source = sourceFingerprint();
  if (builtFingerprint() === source) return;
  try {
    execFileSync("pnpm", ["build"], { cwd: REPOSITORY, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    throw new BuildFailed(`pnpm build failed:\n${stdout.slice(-2000)}${stderr.slice(-2000)}`);
  }
  writeFileSync(BUILT_FROM, source);
}
