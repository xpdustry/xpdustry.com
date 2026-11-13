/**
 * Launch, check, drive and stop a production build of the Xpdustry site.
 *
 *   verify.ts launch [--live]   build, serve on a free port, wait until pages render
 *   verify.ts doctor            is the running instance ours, healthy and built from this source?
 *   verify.ts run [label] [--browser firefox]
 *                               run JavaScript from stdin against the instance (see SKILL.md)
 *   verify.ts audit [locale…]   look for text that wraps, truncates, collides or is clipped
 *   verify.ts seo [--accept]    check every sitemap page for search regressions against the baseline
 *   verify.ts stop              stop the instance this checkout launched
 */

import { audit } from "./audit.ts";
import { engine } from "./browser.ts";
import { Failure, doctor, fail, launch, stop } from "./instance.ts";
import { run } from "./run.ts";
import { seo } from "./seo.ts";
import { LOCALES } from "./site.ts";

const [command, ...given] = process.argv.slice(2);
const flag = given.indexOf("--browser");
const browser = flag < 0 ? "chromium" : (given[flag + 1] ?? "");
const rest = flag < 0 ? given : given.toSpliced(flag, 2);
const commands: Record<string, () => Promise<void>> = {
  launch: () => launch(rest.includes("--live")),
  doctor,
  run: () => run(rest[0] ?? "drive", engine(browser)),
  audit: () => audit(rest.length > 0 ? rest : LOCALES),
  seo: () => seo(rest.includes("--accept")),
  stop
};

try {
  const action =
    commands[command ?? ""] ??
    fail(`usage: verify.ts ${Object.keys(commands).join(" | ")} (see SKILL.md)`);
  await action();
} catch (error) {
  if (!(error instanceof Failure)) throw error;
  console.error(`verify: ${error.message}`);
  process.exitCode = 1;
}
