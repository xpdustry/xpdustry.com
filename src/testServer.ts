import { spawn } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

/** For tests only: a fresh `scripts/serve.ts` on a free port, with caches of its own. */
export async function startProductionServer(): Promise<{
  origin: string;
  stop: () => Promise<void>;
}> {
  const server = spawn(process.execPath, ["scripts/serve.ts"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: { ...process.env, PORT: "0", HOST: "127.0.0.1", TEST: "" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const exited = once(server, "exit");
  const stop = async () => {
    server.kill();
    await exited;
  };
  try {
    const origin = await new Promise<string>((resolve, reject) => {
      let output = "";
      server.stdout.on("data", (chunk) => {
        output += String(chunk);
        const address = /http:\/\/127\.0\.0\.1:\d+/.exec(output)?.[0];
        if (address) resolve(address);
      });
      server.stderr.on("data", (chunk) => {
        output += String(chunk);
      });
      server.once("error", reject);
      server.once("exit", () => reject(new Error(`File server exited: ${output}`)));
    });
    return { origin, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}
