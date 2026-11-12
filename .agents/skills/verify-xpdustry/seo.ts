import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { report, withBrowser } from "./browser.ts";
import { REPO, SKILL_DIR, fail, get, healthyInstance } from "./instance.ts";
import { ENGLISH, LOCALES, ORIGIN, localeOf } from "./site.ts";

const BASELINE = join(SKILL_DIR, "seo-baseline.json");
const TITLE_MAX = 70;
const DESCRIPTION = { min: 50, max: 170 };
const REQUIRED_META = ["og:title", "og:description", "og:image", "og:image:alt", "og:locale"];

/** What a crawler reads from a page, taken from the HTML as served: scripts never run. */
function crawlerView() {
  const attribute = (element: Element, name: string) => element.getAttribute(name) ?? "";
  const all = (selector: string) => [...document.querySelectorAll(selector)];

  function metaTags() {
    const meta: Record<string, string[]> = {};
    for (const element of all("meta[name], meta[property]")) {
      const name = element.getAttribute("name") ?? attribute(element, "property");
      (meta[name] ??= []).push(attribute(element, "content"));
    }
    return meta;
  }

  function mainWords() {
    const main = document.querySelector("main");
    if (!main) return 0;
    const copy = main.cloneNode(true) as HTMLElement;
    for (const hidden of copy.querySelectorAll("script, style")) hidden.remove();
    return copy.textContent.split(/\s+/).filter(Boolean).length;
  }

  const internalLinks = all("a[href^='/']").map(
    (link) => link.getAttribute("href")!.split("#")[0] || "/"
  );
  return {
    lang: document.documentElement.lang,
    title: document.title.trim(),
    description:
      all('meta[name="description"]').map((element) => attribute(element, "content"))[0] ?? "",
    meta: metaTags(),
    canonicals: all('link[rel="canonical"]').map((link) => link.getAttribute("href")),
    alternates: Object.fromEntries(
      all('link[rel="alternate"][hreflang]').map((link) => [
        attribute(link, "hreflang"),
        attribute(link, "href")
      ])
    ),
    headings: all("h1").map((heading) => heading.textContent.trim().replaceAll(/\s+/g, " ")),
    structuredData: all('script[type="application/ld+json"]').map((script) => script.textContent),
    links: [...new Set(internalLinks)],
    imagesWithoutAlt: all("img:not([alt])").length,
    words: mainWords()
  };
}

type CrawledPage = ReturnType<typeof crawlerView>;
type Crawl = Map<string, CrawledPage>;
type Snapshot = Record<string, Record<string, string | number | null>>;

const firstMeta = (page: CrawledPage, name: string) => page.meta[name]?.[0];
const canonicalOf = (page: CrawledPage) => page.canonicals[0] ?? null;

async function sitemapPaths(base: string): Promise<string[]> {
  const sitemap = await get(base, "/sitemap.xml");
  if (sitemap.status !== 200) fail(`/sitemap.xml answered ${sitemap.status}`);
  return [...sitemap.body.toString().matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    ([, location]) => location!.slice(ORIGIN.length) || "/"
  );
}

async function robotsProblems(base: string): Promise<string[]> {
  const robots = (await get(base, "/robots.txt")).body.toString();
  const blocks =
    !robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`) || /^Disallow: \/\s*$/m.test(robots);
  return blocks ? ["robots.txt blocks the site or does not name the sitemap"] : [];
}

/** Every sitemap page that answers 200, read as a crawler with no cookies reads it. */
async function crawl(base: string, paths: string[]) {
  const pages: Crawl = new Map();
  const problems: string[] = [];
  await withBrowser(async (browser) => {
    const context = await browser.newContext({ javaScriptEnabled: false, locale: "en" });
    const page = await context.newPage();
    for (const path of paths) {
      const { status } = await get(base, path, ENGLISH);
      if (status !== 200) {
        problems.push(`${path}: in the sitemap but answers ${status}`);
        continue;
      }
      await context.clearCookies();
      await page.goto(base + path, { waitUntil: "domcontentloaded" });
      pages.set(path, await page.evaluate(crawlerView));
    }
  });
  return { pages, problems };
}

function duplicateProblems(pages: Crawl): string[] {
  const problems: string[] = [];
  for (const field of ["title", "description"] as const) {
    const seen = new Map<string, string>();
    for (const [path, page] of pages) {
      const first = seen.get(page[field]);
      if (first) problems.push(`${path}: same ${field} as ${first}`);
      else seen.set(page[field], path);
    }
  }
  return problems;
}

/** The message of every rule that is broken, in order. */
const broken = (rules: [boolean, string][]) =>
  rules.filter(([isBroken]) => isBroken).map(([, message]) => message);

function lengthProblems({ title, description }: CrawledPage): string[] {
  return broken([
    [
      !title || title.length > TITLE_MAX,
      `title is ${title.length} characters (limit ${TITLE_MAX}): ${title}`
    ],
    [
      description.length < DESCRIPTION.min || description.length > DESCRIPTION.max,
      `description is ${description.length} characters (want ${DESCRIPTION.min}-${DESCRIPTION.max})`
    ]
  ]);
}

function repeatedMetaProblems(page: CrawledPage): string[] {
  const repeatable = (name: string) =>
    name.startsWith("og:locale:alternate") || name.startsWith("article:");
  return Object.entries(page.meta)
    .filter(([name, values]) => values.length > 1 && !repeatable(name))
    .map(([name, values]) => `${name} appears ${values.length} times`);
}

function indexingProblems(page: CrawledPage, path: string): string[] {
  const { canonicals, lang, headings } = page;
  return broken([
    [
      canonicals.length !== 1 || canonicalOf(page) !== ORIGIN + path,
      `canonical is ${JSON.stringify(canonicals)}, expected ${ORIGIN}${path}`
    ],
    [firstMeta(page, "robots")?.includes("noindex") === true, "is marked noindex"],
    [lang !== localeOf(path), `<html lang="${lang}"> on a ${localeOf(path)} page`],
    [headings.length !== 1, `has ${headings.length} h1 headings`]
  ]);
}

/** Every language is listed, and each listed page lists this one back. */
function hreflangProblems(page: CrawledPage, path: string, pages: Crawl): string[] {
  const languages = Object.keys(page.alternates).sort().join(" ");
  const complete = languages === [...LOCALES, "x-default"].sort().join(" ");
  const returned = Object.entries(page.alternates).flatMap(([language, href]) => {
    const other = pages.get(href.slice(ORIGIN.length) || "/");
    if (!other) return [`hreflang ${language} points outside the sitemap: ${href}`];
    return other.alternates[localeOf(path)] === canonicalOf(page)
      ? []
      : [`hreflang ${language} is not returned by ${href}`];
  });
  return [...(complete ? [] : [`hreflang lists ${languages}`]), ...returned];
}

function openGraphProblems(page: CrawledPage): string[] {
  const problems = [...REQUIRED_META, "twitter:card"]
    .filter((name) => !firstMeta(page, name))
    .map((name) => `missing ${name}`);
  const url = firstMeta(page, "og:url");
  if (url !== canonicalOf(page)) problems.push(`og:url ${url} differs from the canonical`);
  return problems;
}

/** The rules every page is held to that need nothing but the crawl, in the order they report. */
const PAGE_RULES: ((page: CrawledPage, path: string, pages: Crawl) => string[])[] = [
  lengthProblems,
  repeatedMetaProblems,
  indexingProblems,
  hreflangProblems,
  openGraphProblems
];

async function cardProblems(base: string, card: string): Promise<string[]> {
  if (!card) return [];
  const image = await get(base, card);
  const type = image.headers["content-type"];
  return image.status === 200 && type === "image/png"
    ? []
    : [`card ${card} answers ${image.status} ${type}`];
}

/** The `@type` of every structured data node, and why a block that does not parse failed. */
function structuredData(page: CrawledPage) {
  const types: string[] = [];
  const problems: string[] = [];
  for (const block of page.structuredData) {
    try {
      const graph = JSON.parse(block)["@graph"] as { "@type": string }[];
      types.push(...graph.map((node) => node["@type"]));
    } catch (error) {
      problems.push(`structured data does not parse: ${(error as Error).message}`);
    }
  }
  return { types, problems };
}

/** A page's problems, and what the baseline records about it. */
async function inspect(base: string, path: string, page: CrawledPage, pages: Crawl) {
  const card = (firstMeta(page, "og:image") ?? "").slice(ORIGIN.length);
  const { types, problems: dataProblems } = structuredData(page);
  const problems = [
    ...PAGE_RULES.flatMap((rule) => rule(page, path, pages)),
    ...(await cardProblems(base, card)),
    ...dataProblems,
    ...(page.imagesWithoutAlt > 0
      ? [`${page.imagesWithoutAlt} image(s) without an alt attribute`]
      : [])
  ];
  const entry = {
    title: page.title,
    description: page.description,
    h1: page.headings[0] ?? null,
    canonical: canonicalOf(page),
    card,
    structuredData: types.sort().join(", "),
    words: page.words,
    links: page.links.length
  };
  return { problems: problems.map((problem) => `${path}: ${problem}`), entry };
}

/** Every internal link, with the first page found linking to it. */
function linkSources(pages: Crawl): Map<string, string> {
  const linked = new Map<string, string>();
  for (const [path, page] of pages) {
    for (const href of page.links) if (!linked.has(href)) linked.set(href, path);
  }
  return linked;
}

const redirectTarget = ({ location }: Record<string, string>) =>
  location ? ` to ${location}` : "";
const isFile = (href: string) => href.slice(href.lastIndexOf("/")).includes(".");

async function linkProblem(base: string, href: string, pages: Crawl) {
  const { status, headers } = await get(base, href, ENGLISH);
  if (status !== 200) return `answers ${status}${redirectTarget(headers)}`;
  if (pages.has(href) || isFile(href)) return undefined;
  return "is not in the sitemap";
}

async function linkProblems(base: string, linked: Map<string, string>, pages: Crawl) {
  const problems: string[] = [];
  for (const [href, source] of [...linked].sort(([a], [b]) => a.localeCompare(b))) {
    const problem = await linkProblem(base, href, pages);
    if (problem) problems.push(`${source}: links to ${href}, which ${problem}`);
  }
  return problems;
}

const union = (one: object, other: object) =>
  [...new Set([...Object.keys(one), ...Object.keys(other)])].sort();

function baselineChanges(before: Snapshot, now: Snapshot): string[] {
  return union(before, now).flatMap((path) => {
    const [old, current] = [before[path], now[path]];
    if (!old) return [`${path}: new page`];
    if (!current) return [`${path}: gone from the sitemap`];
    return union(old, current)
      .filter((key) => old[key] !== current[key])
      .map(
        (key) =>
          `${path}: ${key} was ${JSON.stringify(old[key])}, now ${JSON.stringify(current[key])}`
      );
  });
}

/** Compares with the baseline, or records the snapshot as the new one. */
function compareWithBaseline(snapshot: Snapshot, accept: boolean): string[] {
  if (accept || !existsSync(BASELINE)) {
    writeFileSync(BASELINE, `${JSON.stringify(snapshot, null, 2)}\n`);
    console.log(
      `baseline written: ${relative(REPO, BASELINE)} (${Object.keys(snapshot).length} pages)`
    );
    return [];
  }
  return baselineChanges(JSON.parse(readFileSync(BASELINE, "utf8")) as Snapshot, snapshot);
}

export async function seo(accept: boolean) {
  const { base, live } = healthyInstance();
  if (live) {
    fail(
      "`seo` compares page text with the baseline, which live counts change; use a default launch"
    );
  }
  const paths = await sitemapPaths(base);
  const problems = await robotsProblems(base);
  const { pages, problems: unreachable } = await crawl(base, paths);
  problems.push(...unreachable, ...duplicateProblems(pages));

  const snapshot: Snapshot = {};
  for (const [path, page] of pages) {
    const inspected = await inspect(base, path, page, pages);
    problems.push(...inspected.problems);
    snapshot[path] = inspected.entry;
  }
  const linked = linkSources(pages);
  problems.push(...(await linkProblems(base, linked, pages)));
  const changes = compareWithBaseline(snapshot, accept);

  report("seo", [
    ...problems.map((line) => `PROBLEM ${line}`),
    ...changes.map((line) => `CHANGED ${line}`),
    `seo: ${pages.size} pages, ${linked.size} internal links, ` +
      `${problems.length} problem(s), ${changes.length} change(s) from the baseline`
  ]);
  if (problems.length + changes.length > 0) process.exitCode = 1;
}
