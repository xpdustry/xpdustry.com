import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { join } from "node:path";
import { BuildFailed, REPOSITORY, ensureBuild, sourceFingerprint } from "#tests/support/build.ts";
import { httpGet } from "#tests/support/http.ts";
import { startProductionServer, stopProcessGroup } from "#tests/support/server.ts";

export const HOME = join(REPOSITORY, ".verify");
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

export class Failure extends Error {}

export function fail(message: string): never {
  throw new Failure(message);
}

function readInstance(): Instance | undefined {
  return existsSync(STATE) ? (JSON.parse(readFileSync(STATE, "utf8")) as Instance) : undefined;
}

function servesThisCheckout(pid: number): boolean {
  try {
    const command = readFileSync(`/proc/${pid}/cmdline`, "utf8");
    return (
      command.includes("scripts/server/serve.ts") &&
      `${readlinkSync(`/proc/${pid}/cwd`)}/` === REPOSITORY
    );
  } catch {
    return false;
  }
}

export function healthyInstance(): Instance {
  const instance = readInstance();
  if (!instance || !servesThisCheckout(instance.pid)) {
    fail("no running instance; run `launch`, then `doctor`");
  }
  if (instance.source !== sourceFingerprint()) fail(STALE);
  return instance;
}

function refuseIfServing() {
  const running = readInstance();
  if (running && servesThisCheckout(running.pid)) {
    fail(`already running at ${running.base} (pid ${running.pid}); run \`stop\` first`);
  }
  const servingDist = readdirSync("/proc").filter(
    (name) => /^\d+$/.test(name) && servesThisCheckout(Number(name))
  );
  if (servingDist.length > 0) {
    fail(
      `another server of this checkout's dist/ is running (pid ${servingDist.join(", ")}), and a ` +
        "build would replace its files under it; stop it, launch, then start it again"
    );
  }
}

export async function launch(live: boolean) {
  refuseIfServing();
  mkdirSync(HOME, { recursive: true });
  console.log("building if the source changed…");
  try {
    ensureBuild();
  } catch (error) {
    if (error instanceof BuildFailed) fail(error.message);
    throw error;
  }
  const server = await startProductionServer({
    pollLiveStatus: live,
    logFile: LOG,
    detached: true
  }).catch((error: Error) => fail(error.message));
  const instance: Instance = {
    pid: server.pid,
    base: server.origin,
    live,
    source: sourceFingerprint(),
    started: new Date().toISOString()
  };
  writeFileSync(STATE, `${JSON.stringify(instance, null, 2)}\n`);
  console.log(`ready: ${instance.base}  (status polling ${live ? "on" : "off"})`);
}

const RENDERS = [
  { path: "/healthz", shows: '"status":"ok"' },
  { path: "/", shows: "<title>Xpdustry" }
];

async function renderProblem(base: string, { path, shows }: (typeof RENDERS)[number]) {
  const answer = await httpGet(base + path, { "accept-language": "en" });
  const body = await answer.text();
  return answer.ok && body.includes(shows)
    ? []
    : [`${path} answered ${answer.status} without ${shows}`];
}

async function serverProblems({ pid, base }: Instance): Promise<string[]> {
  if (!servesThisCheckout(pid))
    return [`pid ${pid} is not this checkout's server (stopped or reused)`];
  return (await Promise.all(RENDERS.map((render) => renderProblem(base, render)))).flat();
}

export async function doctor() {
  const instance = readInstance() ?? fail("no instance recorded; run `launch`");
  const problems = await serverProblems(instance);
  if (instance.source !== sourceFingerprint()) problems.push(STALE);
  console.log(JSON.stringify({ ...instance, healthy: problems.length === 0, problems }, null, 2));
  if (problems.length > 0) process.exitCode = 1;
}

export async function stop() {
  const instance = readInstance();
  if (!instance) {
    console.log("nothing to stop");
    return;
  }
  if (servesThisCheckout(instance.pid)) {
    await stopProcessGroup(instance.pid);
    console.log(`stopped pid ${instance.pid}`);
  } else {
    console.log(`pid ${instance.pid} was already gone`);
  }
  rmSync(STATE);
  console.log(`evidence kept in ${join(HOME, "evidence")}`);
}
