/**
 * Launch, check, drive and stop a production build of the Xpdustry site.
 *
 *   verify.ts launch [--live]   build, serve on a free port, wait until pages render
 *   verify.ts doctor            is the running instance ours, healthy and built from this source?
 *   verify.ts run [label]       run JavaScript from stdin against the instance (see SKILL.md)
 *   verify.ts audit [locale…]   look for text that wraps, truncates or collides
 *   verify.ts seo [--accept]    check every sitemap page for search regressions against the baseline
 *   verify.ts stop              stop the instance this checkout launched
 */

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
  writeFileSync,
} from "node:fs";
import { createServer } from "node:net";
import { dirname, join, relative } from "node:path";
import { text } from "node:stream/consumers";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import type { Browser, BrowserContext, Page } from "playwright";

const SKILL_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = join(SKILL_DIR, "../../..");
const HOME = join(REPO, ".verify");
const STATE = join(HOME, "instance.json");
const LOG = join(HOME, "server.log");
const BASELINE = join(SKILL_DIR, "seo-baseline.json");

const ORIGIN = "https://xpdustry.com";
const LOCALES = ["en", "fr", "ru"];
const WIDTHS = [1440, 1280, 1160, 1000, 760, 600, 390, 320];
const PAGES = ["/", "/blog", "/blog/nohorny-4-beta-11", "/blog/nohorny-4-beta-8", "/no-such-page"];
const TITLE_MAX = 70;
const DESCRIPTION = { min: 50, max: 170 };

interface Instance {
  pid: number;
  base: string;
  live: boolean;
  source: string;
  started: string;
}

class Failure extends Error {}

function fail(message: string): never {
  throw new Failure(message);
}

/** Everything the build reads. Git is not involved, so this works in an export or a container too. */
const BUILD_INPUTS = ["src", "public", "scripts", "vite", "package.json", "pnpm-lock.yaml"];
const BUILD_CONFIG = /^(?:vite|vitest)\.config\.ts$|^tsconfig\.json$|^gt\.config\.json$/;

/** Changes whenever a file the build reads is added, removed or rewritten. */
function sourceFingerprint(): string {
  const digest = createHash("sha256");
  const inputs = [...BUILD_INPUTS, ...readdirSync(REPO).filter((name) => BUILD_CONFIG.test(name))];
  for (const input of inputs.sort()) {
    const root = join(REPO, input);
    const stats = statSync(root, { throwIfNoEntry: false });
    if (!stats) continue;
    const files = stats.isDirectory()
      ? readdirSync(root, { recursive: true, encoding: "utf8" }).map((name) => join(input, name))
      : [input];
    for (const file of files.sort()) {
      const { size, mtimeMs } = statSync(join(REPO, file));
      digest.update(`${file}\0${size}\0${mtimeMs}\n`);
    }
  }
  return digest.digest("hex").slice(0, 16);
}

function readInstance(): Instance | undefined {
  return existsSync(STATE) ? (JSON.parse(readFileSync(STATE, "utf8")) as Instance) : undefined;
}

/** The recorded pid is still the server this checkout started. */
function isOurs({ pid }: Instance): boolean {
  try {
    const command = readFileSync(`/proc/${pid}/cmdline`, "utf8");
    return command.includes("scripts/serve.ts") && readlinkSync(`/proc/${pid}/cwd`) === REPO;
  } catch {
    return false;
  }
}

function healthyInstance(): Instance {
  const instance = readInstance();
  if (!instance || !isOurs(instance)) fail("no running instance; run `launch`, then `doctor`");
  if (instance.source !== sourceFingerprint()) {
    fail("source changed since the build; `stop` then `launch` again");
  }
  return instance;
}

interface Answer {
  status: number;
  /** Lower-case header names. */
  headers: Record<string, string>;
  body: Buffer;
}

/** GET without following redirects. */
async function get(base: string, path: string, headers: Record<string, string> = {}) {
  const response = await fetch(base + path, { headers, redirect: "manual" });
  const answer: Answer = {
    status: response.status,
    headers: Object.fromEntries(response.headers),
    body: Buffer.from(await response.arrayBuffer()),
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
        typeof address === "object" && address ? resolve(address.port) : reject(),
      );
    });
  });
}

async function launch(live: boolean) {
  const running = readInstance();
  if (running && isOurs(running)) {
    fail(`already running at ${running.base} (pid ${running.pid}); run \`stop\` first`);
  }
  mkdirSync(HOME, { recursive: true });
  console.log("building…");
  try {
    execFileSync("pnpm", ["build"], { cwd: REPO, encoding: "utf8", stdio: "pipe" });
  } catch (error) {
    const { stdout = "", stderr = "" } = error as { stdout?: string; stderr?: string };
    fail(`pnpm build failed:\n${stdout.slice(-2000)}${stderr.slice(-2000)}`);
  }
  const port = await freePort();
  const log = openSync(LOG, "w");
  const server = spawn("node", ["scripts/serve.ts"], {
    cwd: REPO,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: "127.0.0.1",
      ...(live ? {} : { XPD_DISABLE_STATUS: "1" }),
    },
    stdio: ["ignore", log, log],
    detached: true,
  });
  server.unref();
  const instance: Instance = {
    pid: server.pid ?? fail("the server did not start"),
    base: `http://127.0.0.1:${port}`,
    live,
    source: sourceFingerprint(),
    started: new Date().toISOString(),
  };
  writeFileSync(STATE, `${JSON.stringify(instance, null, 2)}\n`);

  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    if (!isOurs(instance)) fail(`the server exited; see ${LOG}`);
    try {
      const english = { "accept-language": "en" };
      const pages = await Promise.all(
        ["/", "/fr/blog"].map((path) => get(instance.base, path, english)),
      );
      if (pages.every((page) => page.status === 200)) {
        console.log(`ready: ${instance.base}  (status polling ${live ? "on" : "off"})`);
        return;
      }
    } catch {
      // Not listening yet.
    }
    await sleep(400);
  }
  await stop();
  fail(`pages did not render within 40s; see ${LOG}`);
}

async function doctor() {
  const instance = readInstance() ?? fail("no instance recorded; run `launch`");
  const problems: string[] = [];
  if (isOurs(instance)) {
    const english = { "accept-language": "en" };
    const health = await get(instance.base, "/healthz", english);
    if (health.status !== 200 || JSON.parse(health.body.toString()).status !== "ok") {
      problems.push(`/healthz answered ${health.status}: ${health.body.toString().slice(0, 120)}`);
    }
    const home = await get(instance.base, "/", english);
    if (home.status !== 200 || !home.body.includes("<title>Xpdustry")) {
      problems.push(`/ answered ${home.status} without the Xpdustry title`);
    }
  } else {
    problems.push(`pid ${instance.pid} is not this checkout's server (stopped or reused)`);
  }
  if (instance.source !== sourceFingerprint()) {
    problems.push("source changed since the build; `stop` then `launch` again");
  }
  console.log(JSON.stringify({ ...instance, healthy: problems.length === 0, problems }, null, 2));
  if (problems.length > 0) process.exitCode = 1;
}

async function stop() {
  const instance = readInstance();
  if (!instance) {
    console.log("nothing to stop");
    return;
  }
  if (isOurs(instance)) {
    process.kill(-instance.pid, "SIGTERM");
    for (let attempt = 0; attempt < 50 && isOurs(instance); attempt++) await sleep(100);
    if (isOurs(instance)) process.kill(-instance.pid, "SIGKILL");
    console.log(`stopped pid ${instance.pid}`);
  } else {
    console.log(`pid ${instance.pid} was already gone`);
  }
  rmSync(STATE);
  console.log(`evidence kept in ${join(HOME, "evidence")}`);
}

async function withBrowser<T>(use: (browser: Browser) => Promise<T>): Promise<T> {
  const { chromium } = await import("playwright").catch(() =>
    fail("Playwright is not installed; run `pnpm install`"),
  );
  const browser = await chromium
    .launch()
    .catch((error: Error) =>
      fail(`${error.message.split("\n")[0]}\nrun \`pnpm exec playwright install chromium\``),
    );
  try {
    return await use(browser);
  } finally {
    await browser.close();
  }
}

async function settle(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return response;
}

interface Visitor {
  width?: number;
  height?: number;
  /** The browser language, sent as Accept-Language. */
  language?: string;
}

/** A new folder for one run's proof, named by local time. */
function evidenceFolder(label: string): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  const stamp = local.toISOString().slice(0, 19).replaceAll(/[-:]/g, "").replace("T", "-");
  const folder = join(HOME, "evidence", `${stamp}-${label}`);
  mkdirSync(folder, { recursive: true });
  return folder;
}

/** Prints a check's findings and keeps them as evidence. */
function report(label: string, lines: string[]) {
  for (const line of lines) console.log(line);
  const folder = evidenceFolder(label);
  writeFileSync(join(folder, "output.txt"), `${lines.join("\n")}\n`);
  console.log(`evidence: ${folder}`);
}

async function run(label: string) {
  const { base } = healthyInstance();
  const evidence = evidenceFolder(label);
  const code = await text(process.stdin);
  writeFileSync(join(evidence, "drive.js"), code);
  const transcript: string[] = [];

  await withBrowser(async (browser) => {
    const contexts: BrowserContext[] = [];
    const helpers = {
      base,
      browser,
      evidence,
      /** A fresh visitor with no cookies. */
      async newPage({ width = 1280, height = 800, language = "en" }: Visitor = {}) {
        const context = await browser.newContext({
          viewport: { width, height },
          locale: language,
          reducedMotion: "reduce",
          permissions: ["clipboard-read", "clipboard-write"],
        });
        contexts.push(context);
        return context.newPage();
      },
      go: (page: Page, path: string) => settle(page, base + path),
      get: (path: string, headers?: Record<string, string>) => get(base, path, headers),
      /** Save a screenshot and the ARIA tree of what the page shows now. */
      async snap(page: Page, name: string) {
        await page.screenshot({ path: join(evidence, `${name}.png`) });
        const tree = await page.locator("body").ariaSnapshot();
        writeFileSync(
          join(evidence, `${name}.aria.txt`),
          `${page.url()}\n${await page.title()}\n\n${tree}\n`,
        );
      },
      save(name: string, content: string | Uint8Array) {
        writeFileSync(join(evidence, name), content);
      },
      print(...values: unknown[]) {
        const line = values
          .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
          .join(" ");
        console.log(line);
        transcript.push(line);
      },
    };
    const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
    const drive = new AsyncFunction(`{ ${Object.keys(helpers).join(", ")} }`, code);
    try {
      await drive(helpers);
    } catch (error) {
      const pages = contexts.flatMap((context) => context.pages());
      for (const [index, page] of pages.entries()) {
        await page.screenshot({ path: join(evidence, `failure-${index + 1}.png`) }).catch(() => {});
      }
      const stack = error instanceof Error ? (error.stack ?? error.message) : String(error);
      transcript.push(stack);
      const where = /<anonymous>:(\d+):\d+/.exec(stack)?.[1];
      const line = where ? ` (line ${Number(where) - 2} of the script)` : "";
      const message = error instanceof Error ? error.message.split("\n")[0] : String(error);
      console.error(`verify: the script failed${line}: ${message}`);
      console.error("verify: the page at that moment is in failure-*.png, the trace in output.txt");
      process.exitCode = 1;
    } finally {
      writeFileSync(join(evidence, "output.txt"), `${transcript.join("\n")}\n`);
      await Promise.all(contexts.map((context) => context.close()));
      console.log(`evidence: ${evidence}`);
    }
  });
}

const localised = (locale: string, path: string) => {
  const prefix = locale === LOCALES[0] ? "" : `/${locale}`;
  return path === "/" ? prefix || "/" : prefix + path;
};

function layoutIssues(): string[] {
  const found = new Set<string>();
  const width = document.documentElement.clientWidth;
  if (document.documentElement.scrollWidth > width + 1) found.add("page scrolls sideways");
  for (const link of document.querySelectorAll("header nav a")) {
    const lines = new Set<number>();
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = document.createRange();
      text.selectNodeContents(walker.currentNode);
      for (const box of text.getClientRects()) lines.add(Math.round(box.top));
    }
    if (lines.size > 1) found.add(`nav item wraps: ${link.textContent.trim()}`);
  }
  const controls = [...document.querySelectorAll("body > div > header > :is(button, a, div)")]
    .slice(1)
    .map((control) => control.getBoundingClientRect())
    .filter((box) => box.width > 2)
    .sort((one, other) => one.left - other.left);
  for (const [index, box] of controls.entries()) {
    const next = controls[index + 1];
    if (next && next.left - box.right > 24) {
      found.add(`header control stranded ${Math.round(next.left - box.right)}px from the next one`);
    }
  }
  for (const tab of document.querySelectorAll("section > header")) {
    const title = tab.querySelector("h2");
    const action = tab.querySelector("a");
    const subtitle = tab.querySelector("h2 + span");
    if (
      title &&
      action &&
      title.getBoundingClientRect().right > action.getBoundingClientRect().left - 2
    ) {
      found.add(`section title runs under its button: ${title.textContent}`);
    }
    if (subtitle && subtitle.scrollWidth > subtitle.clientWidth + 1) {
      found.add(`section subtitle truncated: ${subtitle.textContent}`);
    }
  }
  for (const element of document.querySelectorAll("main *, footer *")) {
    const hasText = [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    if (!hasText || element.closest(".sr-only")) continue;
    if (getComputedStyle(element).visibility === "hidden") continue;
    const box = element.getBoundingClientRect();
    if (box.width > 2 && box.height > 2 && box.right > width + 1) {
      found.add(`text leaves the screen: ${element.textContent.trim().slice(0, 40)}`);
    }
  }
  return [...found];
}

async function audit(locales: string[]) {
  const { base } = healthyInstance();
  const issues: string[] = [];
  await withBrowser(async (browser) => {
    for (const locale of locales) {
      for (const width of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width, height: 900 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        for (const path of PAGES) {
          const url = localised(locale, path);
          await settle(page, base + url);
          for (const issue of await page.evaluate(layoutIssues)) {
            issues.push(`${width}px ${url}: ${issue}`);
          }
        }
        await context.close();
      }
      console.error(`audit: ${locale} done`);
    }
  });
  const renders = locales.length * WIDTHS.length * PAGES.length;
  report("audit", [
    ...issues,
    `audit: ${issues.length} issue(s) across ${renders} page renders (${locales.join(", ")})`,
  ]);
  if (issues.length > 0) process.exitCode = 1;
}

/** What a crawler reads from a page, taken from the HTML as served: scripts never run. */
function crawlerView() {
  const contents = (selector: string) =>
    [...document.querySelectorAll(selector)].map(
      (element) => element.getAttribute("content") ?? "",
    );
  const meta: Record<string, string[]> = {};
  for (const element of document.querySelectorAll("meta[name], meta[property]")) {
    const name = element.getAttribute("name") ?? element.getAttribute("property") ?? "";
    (meta[name] ??= []).push(element.getAttribute("content") ?? "");
  }
  const main = document.querySelector("main")?.cloneNode(true) as HTMLElement | undefined;
  for (const hidden of main?.querySelectorAll("script, style") ?? []) hidden.remove();
  return {
    lang: document.documentElement.lang,
    title: document.title.trim(),
    description: contents('meta[name="description"]')[0] ?? "",
    meta,
    canonicals: [...document.querySelectorAll('link[rel="canonical"]')].map((link) =>
      link.getAttribute("href"),
    ),
    alternates: Object.fromEntries(
      [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => [
        link.getAttribute("hreflang") ?? "",
        link.getAttribute("href") ?? "",
      ]),
    ),
    headings: [...document.querySelectorAll("h1")].map((heading) =>
      heading.textContent.trim().replaceAll(/\s+/g, " "),
    ),
    structuredData: [...document.querySelectorAll('script[type="application/ld+json"]')].map(
      (script) => script.textContent,
    ),
    links: [
      ...new Set(
        [...document.querySelectorAll("a[href^='/']")].map(
          (link) => link.getAttribute("href")!.split("#")[0] || "/",
        ),
      ),
    ],
    imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
    words: (main?.textContent ?? "").split(/\s+/).filter(Boolean).length,
  };
}

type CrawledPage = ReturnType<typeof crawlerView>;
type Snapshot = Record<string, Record<string, string | number | null>>;

const localeOf = (path: string) =>
  LOCALES.slice(1).find((locale) => path === `/${locale}` || path.startsWith(`/${locale}/`)) ??
  LOCALES[0]!;

async function seo(accept: boolean) {
  const { base, live } = healthyInstance();
  if (live)
    fail(
      "`seo` compares page text with the baseline, which live counts change; use a default launch",
    );
  const english = { "accept-language": "en" };
  const problems: string[] = [];

  const sitemap = await get(base, "/sitemap.xml");
  if (sitemap.status !== 200) fail(`/sitemap.xml answered ${sitemap.status}`);
  const paths = [...sitemap.body.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => location!.slice(ORIGIN.length) || "/",
  );
  const robots = (await get(base, "/robots.txt")).body.toString();
  if (!robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`) || /^Disallow: \/\s*$/m.test(robots)) {
    problems.push("robots.txt blocks the site or does not name the sitemap");
  }

  const pages = new Map<string, CrawledPage>();
  await withBrowser(async (browser) => {
    const context = await browser.newContext({ javaScriptEnabled: false, locale: "en" });
    const page = await context.newPage();
    for (const path of paths) {
      const { status } = await get(base, path, english);
      if (status !== 200) {
        problems.push(`${path}: in the sitemap but answers ${status}`);
        continue;
      }
      await context.clearCookies();
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      pages.set(path, await page.evaluate(crawlerView));
    }
  });

  for (const field of ["title", "description"] as const) {
    const seen = new Map<string, string>();
    for (const [path, page] of pages) {
      const first = seen.get(page[field]);
      if (first) problems.push(`${path}: same ${field} as ${first}`);
      else seen.set(page[field], path);
    }
  }

  const snapshot: Snapshot = {};
  for (const [path, page] of pages) {
    const say = (message: string) => problems.push(`${path}: ${message}`);
    const one = (name: string) => page.meta[name]?.[0];
    const canonical = page.canonicals[0] ?? null;

    if (!page.title || page.title.length > TITLE_MAX) {
      say(`title is ${page.title.length} characters (limit ${TITLE_MAX}): ${page.title}`);
    }
    if (page.description.length < DESCRIPTION.min || page.description.length > DESCRIPTION.max) {
      say(
        `description is ${page.description.length} characters (want ${DESCRIPTION.min}-${DESCRIPTION.max})`,
      );
    }
    for (const [name, values] of Object.entries(page.meta)) {
      const repeatable = name.startsWith("og:locale:alternate") || name.startsWith("article:");
      if (values.length > 1 && !repeatable) say(`${name} appears ${values.length} times`);
    }
    if (page.canonicals.length !== 1 || canonical !== ORIGIN + path) {
      say(`canonical is ${JSON.stringify(page.canonicals)}, expected ${ORIGIN}${path}`);
    }
    if (one("robots")?.includes("noindex")) say("is marked noindex");
    if (page.lang !== localeOf(path)) say(`<html lang="${page.lang}"> on a ${localeOf(path)} page`);
    if (page.headings.length !== 1) say(`has ${page.headings.length} h1 headings`);

    const languages = Object.keys(page.alternates).sort().join(" ");
    if (languages !== [...LOCALES, "x-default"].sort().join(" ")) {
      say(`hreflang lists ${languages}`);
    }
    for (const [language, href] of Object.entries(page.alternates)) {
      const other = pages.get(href.slice(ORIGIN.length) || "/");
      if (!other) say(`hreflang ${language} points outside the sitemap: ${href}`);
      else if (other.alternates[localeOf(path)] !== canonical) {
        say(`hreflang ${language} is not returned by ${href}`);
      }
    }

    const required = ["og:title", "og:description", "og:image", "og:image:alt", "og:locale"];
    for (const name of [...required, "twitter:card"]) if (!one(name)) say(`missing ${name}`);
    if (one("og:url") !== canonical) say(`og:url ${one("og:url")} differs from the canonical`);
    const card = (one("og:image") ?? "").slice(ORIGIN.length);
    if (card) {
      const image = await get(base, card);
      if (image.status !== 200 || image.headers["content-type"] !== "image/png") {
        say(`card ${card} answers ${image.status} ${image.headers["content-type"]}`);
      }
    }

    const types: string[] = [];
    for (const block of page.structuredData) {
      try {
        const graph = JSON.parse(block)["@graph"] as { "@type": string }[];
        types.push(...graph.map((node) => node["@type"]));
      } catch (error) {
        say(`structured data does not parse: ${(error as Error).message}`);
      }
    }
    if (page.imagesWithoutAlt > 0)
      say(`${page.imagesWithoutAlt} image(s) without an alt attribute`);

    snapshot[path] = {
      title: page.title,
      description: page.description,
      h1: page.headings[0] ?? null,
      canonical,
      card,
      structuredData: types.sort().join(", "),
      words: page.words,
      links: page.links.length,
    };
  }

  const linked = new Map<string, string>();
  for (const [path, page] of pages) {
    for (const href of page.links) if (!linked.has(href)) linked.set(href, path);
  }
  for (const [href, source] of [...linked].sort()) {
    const { status, headers } = await get(base, href, english);
    const isFile = href.slice(href.lastIndexOf("/")).includes(".");
    if (status !== 200) {
      const target = headers.location ? ` to ${headers.location}` : "";
      problems.push(`${source}: links to ${href}, which answers ${status}${target}`);
    } else if (!pages.has(href) && !isFile) {
      problems.push(`${source}: links to ${href}, which is not in the sitemap`);
    }
  }

  const changes: string[] = [];
  if (accept || !existsSync(BASELINE)) {
    writeFileSync(BASELINE, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(`baseline written: ${relative(REPO, BASELINE)} (${pages.size} pages)`);
  } else {
    const before = JSON.parse(readFileSync(BASELINE, "utf8")) as Snapshot;
    for (const path of [...new Set([...Object.keys(before), ...Object.keys(snapshot)])].sort()) {
      const [old, now] = [before[path], snapshot[path]];
      if (!old) changes.push(`${path}: new page`);
      else if (!now) changes.push(`${path}: gone from the sitemap`);
      else {
        for (const key of [...new Set([...Object.keys(old), ...Object.keys(now)])].sort()) {
          if (old[key] !== now[key]) {
            changes.push(
              `${path}: ${key} was ${JSON.stringify(old[key])}, now ${JSON.stringify(now[key])}`,
            );
          }
        }
      }
    }
  }

  report("seo", [
    ...problems.map((line) => `PROBLEM ${line}`),
    ...changes.map((line) => `CHANGED ${line}`),
    `seo: ${pages.size} pages, ${linked.size} internal links, ` +
      `${problems.length} problem(s), ${changes.length} change(s) from the baseline`,
  ]);
  if (problems.length + changes.length > 0) process.exitCode = 1;
}

const [command, ...rest] = process.argv.slice(2);
const commands: Record<string, () => Promise<void>> = {
  launch: () => launch(rest.includes("--live")),
  doctor,
  run: () => run(rest[0] ?? "drive"),
  audit: () => audit(rest.length > 0 ? rest : LOCALES),
  seo: () => seo(rest.includes("--accept")),
  stop,
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
