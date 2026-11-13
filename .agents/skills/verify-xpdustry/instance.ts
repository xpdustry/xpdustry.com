import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { ENGLISH } from "./site.ts";

export const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
export const REPO = join(SKILL_DIR, "../../..");
export const HOME = join(REPO, ".verify");
const STATE = join(HOME, "instance.json");
const LOG = join(HOME, "server.log");

const STALE = "source changed since the build; `stop` then `launch` again";

interface Instance {
  pid: number;
  base: string;
  live: boolean;
  source: string;
  started: string;
}

/** An expected failure: the CLI prints its message instead of a stack trace. */
export class Failure extends Error {}

export function fail(message: string): never {
  throw new Failure(message);
}

/** Everything the build reads. Git is not involved, so this works in an export or a container too. */
const BUILD_INPUTS = ["src", "public", "scripts", "package.json", "pnpm-lock.yaml"];
const BUILD_CONFIG = /^(?:vite|vitest)\.config\.ts$|^tsconfig\.json$|^gt\.config\.json$/;

/** The files of one build input, relative to the repository. */
function filesOf(input: string): string[] {
  const root = join(REPO, input);
  const stats = statSync(root, { throwIfNoEntry: false });
  if (!stats) return [];
  if (!stats.isDirectory()) return [input];
  return readdirSync(root, { recursive: true, encoding: "utf8" }).map((name) => join(input, name));
}

/** Changes whenever a file the build reads is added, removed or rewritten. */
function sourceFingerprint(): string {
  const digest = createHash("sha256");
  const inputs = [...BUILD_INPUTS, ...readdirSync(REPO).filter((name) => BUILD_CONFIG.test(name))];
  for (const input of inputs.sort((a, b) => a.localeCompare(b))) {
    for (const file of filesOf(input).sort()) {
      const { size, mtimeMs } = statSync(join(REPO, file));
      digest.update(`${file}\0${size}\0${mtimeMs}\n`);
    }
  }
  return digest.digest("hex").slice(0, 16);
}

function readInstance(): Instance | undefined {
  return existsSync(STATE) ? (JSON.parse(readFileSync(STATE, "utf8")) as Instance) : undefined;
}

/** The process is a `scripts/serve.ts` running from this checkout, so it serves its `dist/`. */
function servesThisCheckout(pid: number): boolean {
  try {
    const command = readFileSync(`/proc/${pid}/cmdline`, "utf8");
    return command.includes("scripts/serve.ts") && readlinkSync(`/proc/${pid}/cwd`) === REPO;
  } catch {
    return false;
  }
}

/** The recorded pid is still the server this checkout started. */
const isOurs = ({ pid }: Instance) => servesThisCheckout(pid);

/** The running instance, refusing one that is gone or was built from older source. */
export function healthyInstance(): Instance {
  const instance = readInstance();
  if (!instance || !isOurs(instance)) fail("no running instance; run `launch`, then `doctor`");
  if (instance.source !== sourceFingerprint()) fail(STALE);
  return instance;
}

interface Answer {
  status: number;
  /** Lower-case header names. */
  headers: Record<string, string>;
  body: Buffer;
}

/** GET without following redirects. */
export async function get(base: string, path: string, headers: Record<string, string> = {}) {
  const response = await fetch(base + path, { headers, redirect: "manual" });
  const answer: Answer = {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: Buffer.from(await response.arrayBuffer())
  };
  return answer;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() =>
        typeof address === "object" && address ? resolve(address.port) : reject()
      );
    });
  });
}

function build() {
  try {
    execFileSync("pnpm", ["build"], { cwd: REPO, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    fail(`pnpm build failed:\n${stdout.slice(-2000)}${stderr.slice(-2000)}`);
  }
}

/** Starts the built server in its own process group, so `stop` can end it and its children. */
async function serve(live: boolean): Promise<Instance> {
  const port = await freePort();
  const log = openSync(LOG, "w");
  const server = spawn("node", ["scripts/serve.ts"], {
    cwd: REPO,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      ...(live ? {} : { XPD_DISABLE_STATUS: "1" })
    },
    stdio: ["ignore", log, log],
    detached: true
  });
  server.unref();
  return {
    pid: server.pid ?? fail("the server did not start"),
    base: `http://127.0.0.1:${port}`,
    live,
    source: sourceFingerprint(),
    started: new Date().toISOString()
  };
}

async function rendersPages(instance: Instance): Promise<boolean> {
  try {
    const pages = await Promise.all(
      ["/", "/fr/blog"].map((path) => get(instance.base, path, ENGLISH))
    );
    return pages.every((page) => page.status === 200);
  } catch {
    // Not listening yet.
    return false;
  }
}

async function waitUntilReady(instance: Instance, timeout: number): Promise<boolean> {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (!isOurs(instance)) fail(`the server exited; see ${LOG}`);
    if (await rendersPages(instance)) return true;
    await sleep(400);
  }
  return false;
}

function refuseIfRunning() {
  const running = readInstance();
  if (running && isOurs(running)) {
    fail(`already running at ${running.base} (pid ${running.pid}); run \`stop\` first`);
  }
  // `pnpm start`, or a preview of it, serves the same `dist/`: the build would swap its files
  // under it, and it would answer with 500s and missing assets until restarted.
  const others = readdirSync("/proc").filter(
    (name) => /^\d+$/.test(name) && servesThisCheckout(+name)
  );
  if (others.length > 0) {
    fail(
      `another server of this checkout's dist/ is running (pid ${others.join(", ")}), and the ` +
        "build would replace its files under it; stop it, launch, then start it again"
    );
  }
}

export async function launch(live: boolean) {
  refuseIfRunning();
  mkdirSync(HOME, { recursive: true });
  console.log("building…");
  build();
  const instance = await serve(live);
  writeFileSync(STATE, `${JSON.stringify(instance, null, 2)}\n`);

  if (await waitUntilReady(instance, 40_000)) {
    console.log(`ready: ${instance.base}  (status polling ${live ? "on" : "off"})`);
    return;
  }
  await stop();
  fail(`pages did not render within 40s; see ${LOG}`);
}

async function healthProblems({ base }: Instance): Promise<string[]> {
  const health = await get(base, "/healthz", ENGLISH);
  const ok = health.status === 200 && JSON.parse(health.body.toString()).status === "ok";
  return ok ? [] : [`/healthz answered ${health.status}: ${health.body.toString().slice(0, 120)}`];
}

async function homeProblems({ base }: Instance): Promise<string[]> {
  const home = await get(base, "/", ENGLISH);
  const ok = home.status === 200 && home.body.includes("<title>Xpdustry");
  return ok ? [] : [`/ answered ${home.status} without the Xpdustry title`];
}

async function serverProblems(instance: Instance): Promise<string[]> {
  if (!isOurs(instance)) {
    return [`pid ${instance.pid} is not this checkout's server (stopped or reused)`];
  }
  return [...(await healthProblems(instance)), ...(await homeProblems(instance))];
}

export async function doctor() {
  const instance = readInstance() ?? fail("no instance recorded; run `launch`");
  const problems = await serverProblems(instance);
  if (instance.source !== sourceFingerprint()) problems.push(STALE);
  console.log(JSON.stringify({ ...instance, healthy: problems.length === 0, problems }, null, 2));
  if (problems.length > 0) process.exitCode = 1;
}

/** Asks the server's process group to exit, and kills it after five seconds. */
async function terminate(instance: Instance) {
  process.kill(-instance.pid, "SIGTERM");
  for (let attempt = 0; attempt < 50 && isOurs(instance); attempt++) await sleep(100);
  if (isOurs(instance)) process.kill(-instance.pid, "SIGKILL");
}

export async function stop() {
  const instance = readInstance();
  if (!instance) {
    console.log("nothing to stop");
    return;
  }
  if (isOurs(instance)) {
    await terminate(instance);
    console.log(`stopped pid ${instance.pid}`);
  } else {
    console.log(`pid ${instance.pid} was already gone`);
  }
  rmSync(STATE);
  console.log(`evidence kept in ${join(HOME, "evidence")}`);
}
