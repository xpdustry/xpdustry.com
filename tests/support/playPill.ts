import type { Page } from "playwright/test";

const HUB = "hub.md.xpdustry.com";

/** A node of a server function's answer, in seroval's JSON form. */
interface Serialised {
  t: number;
  i?: number;
  s?: unknown;
  a?: Serialised[];
  p?: { k: string[]; v: Serialised[] };
  o?: number;
}

const OBJECT = 10;
const NUMBER = 0;
const STRING = 1;
const UNUSED_ID = 1_000_000;

function withHubOnline(node: Serialised, players: number): Serialised {
  if (node.a) return { ...node, a: node.a.map((child) => withHubOnline(child, players)) };
  if (!node.p) return node;
  const { k: keys, v: values } = node.p;
  if (values[keys.indexOf("hostname")]?.s !== HUB) {
    return { ...node, p: { k: keys, v: values.map((child) => withHubOnline(child, players)) } };
  }
  const info = {
    t: OBJECT,
    i: UNUSED_ID,
    p: { k: ["players"], v: [{ t: NUMBER, s: players }] },
    o: 0
  };
  const online = values.toSpliced(keys.indexOf("status"), 1, { t: STRING, s: "online" });
  return { ...node, p: { k: [...keys, "info"], v: [...online, info] } };
}

const hydrated = (page: Page) =>
  page.waitForFunction(() => "hydrated" in document.documentElement.dataset);

const playPill = (page: Page) =>
  page.getByRole("banner").getByRole("button", { name: `IP ${HUB}` });

/**
 * The hub online with `players` on it, as the next poll would bring it: the page fetches its live
 * data again and gets the hub's status replaced.
 */
export async function showPlayers(page: Page, players: number) {
  await page.route("**/_serverFn/**", async (route) => {
    const response = await route.fetch();
    const answer = withHubOnline(JSON.parse(await response.text()) as Serialised, players);
    await route.fulfill({ response, body: JSON.stringify(answer) });
  });
  await hydrated(page);
  await page.evaluate(() => window.__TSR_ROUTER__!.invalidate());
  const digitsWithAnySeparator = new RegExp(
    `^${String(players)
      .split("")
      .join(String.raw`\D?`)}$`
  );
  await playPill(page).getByText(digitsWithAnySeparator).waitFor({ state: "attached" });
}

/** A browser without a clipboard: the pill hands over the address to select instead. */
export async function refuseCopy(page: Page) {
  await hydrated(page);
  await page.evaluate(() =>
    Object.defineProperty(Navigator.prototype, "clipboard", { get: () => undefined })
  );
  await playPill(page).click();
  await playPill(page).getByText(HUB, { exact: true }).waitFor({ state: "attached" });
}
