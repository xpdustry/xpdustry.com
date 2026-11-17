import { Failure, doctor, fail, launch, stop } from "./instance.ts";
import { engine, run } from "./run.ts";

const [command, ...given] = process.argv.slice(2);
const browserFlag = given.indexOf("--browser");
const browser = browserFlag < 0 ? "chromium" : (given[browserFlag + 1] ?? "");
const rest = browserFlag < 0 ? given : given.toSpliced(browserFlag, 2);

const COMMANDS: Record<string, () => Promise<void>> = {
  launch: () => launch(rest.includes("--live")),
  doctor,
  run: () => run(rest[0] ?? "drive", engine(browser)),
  stop
};

try {
  const action =
    COMMANDS[command ?? ""] ??
    fail(`usage: verify.ts ${Object.keys(COMMANDS).join(" | ")} (see SKILL.md)`);
  await action();
} catch (error) {
  if (!(error instanceof Failure)) throw error;
  console.error(`verify: ${error.message}`);
  process.exitCode = 1;
}
