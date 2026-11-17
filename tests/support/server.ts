import { spawn } from "node:child_process";
import { once } from "node:events";
import { openSync } from "node:fs";
import { createServer } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { REPOSITORY } from "./build.ts";

export interface ProductionServer {
  origin: string;
  pid: number;
  stop: () => Promise<void>;
}

export interface ServerOptions {
  pollLiveStatus?: boolean;
  logFile?: string;
  detached?: boolean;
}

const READY_WITHIN_MS = 40_000;
const STOP_WITHIN_MS = 5_000;

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

function serverEnv(port: number, live: boolean): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: String(port), HOST: "127.0.0.1" };
  if (live) delete env.XPD_DISABLE_STATUS;
  else env.XPD_DISABLE_STATUS = "1";
  return env;
}

async function answersHealth(origin: string): Promise<boolean> {
  try {
    return (await fetch(`${origin}/healthz`)).ok;
  } catch {
    return false;
  }
}

function groupAlive(pid: number): boolean {
  try {
    process.kill(-pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function stopProcessGroup(pid: number): Promise<void> {
  if (!groupAlive(pid)) return;
  process.kill(-pid, "SIGTERM");
  const deadline = Date.now() + STOP_WITHIN_MS;
  while (groupAlive(pid) && Date.now() < deadline) await sleep(100);
  if (groupAlive(pid)) process.kill(-pid, "SIGKILL");
}

export async function startProductionServer({
  pollLiveStatus = false,
  logFile,
  detached = false
}: ServerOptions = {}): Promise<ProductionServer> {
  const port = await freePort();
  const output = logFile ? openSync(logFile, "w") : "pipe";
  const server = spawn(process.execPath, ["scripts/serve.ts"], {
    cwd: REPOSITORY,
    env: serverEnv(port, pollLiveStatus),
    stdio: ["ignore", output, output],
    detached
  });
  if (detached) server.unref();
  let said = "";
  server.stdout?.on("data", (chunk) => (said += String(chunk)));
  server.stderr?.on("data", (chunk) => (said += String(chunk)));
  const exited = once(server, "exit");
  let gone = false;
  void exited.then(() => (gone = true));

  const pid = server.pid!;
  const origin = `http://127.0.0.1:${port}`;
  const stop = async () => {
    if (detached) await stopProcessGroup(pid);
    else if (!gone) {
      server.kill();
      await exited;
    }
  };

  const deadline = Date.now() + READY_WITHIN_MS;
  while (!gone && Date.now() < deadline) {
    if (await answersHealth(origin)) return { origin, pid, stop };
    await sleep(200);
  }
  await stop();
  const why = gone ? "exited" : `did not answer within ${READY_WITHIN_MS / 1000}s`;
  throw new Error(`the production server ${why}: ${logFile ? `see ${logFile}` : said}`);
}
