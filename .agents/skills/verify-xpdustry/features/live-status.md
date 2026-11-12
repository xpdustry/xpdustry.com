# Live status

The site shows who is playing right now: a count on every gamemode and on the header pill, the Discord server's online and member counts, and the GitHub star total on the home card. The server polls those sources every 30 seconds and pages refresh from it.

## Sub-features

- `live-health` reports when each source was last reached, at `/healthz`.
- `live-api` serves the server list with status and player counts at `/api/servers`.
- `live-counts` shows counts on the gamemode cards, the section total and the header pill.
- `live-discord` shows online and member counts on the Discord card.
- `live-offline` shows `Offline` for a server that does not answer, without breaking the page.

## How to get to it (user POV)

- Open the home page: the header pill, the `Play with us` card, `Gamemodes` and the Discord card all carry counts.
- Leave the page open; the counts update without a reload.

## Driving it with verify.ts

Preconditions: `$V launch --live`; `doctor` passes. The first poll takes a second or two: the script waits for it. This contacts the real game servers, Discord and GitHub.

```sh
$V run live-status <<'EOF'
const oneLine = (text) => text.split(/\s+/).join(" ");
let health = await get("/healthz");
for (let i = 0; i < 40 && health.body.toString().match(/lastSuccessAt/g)?.length !== 3; i++) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  health = await get("/healthz");
}
const sources = Object.entries(JSON.parse(health.body.toString())).filter(([, value]) => typeof value === "object");
print("live-health:", health.status, Object.fromEntries(sources.map(([name, value]) => [name, value.lastSuccessAt])));
const api = await get("/api/servers");
const { servers } = JSON.parse(api.body.toString());
print("live-api:", api.status, api.headers["cache-control"],
  servers.map((server) => [server.slug, server.status, server.info?.players ?? null]));

const page = await newPage({ width: 1280 });
await go(page, "/");
print("live-counts:", oneLine(await page.locator("#gamemodes > header").innerText()), "|",
  oneLine(await page.locator("#gamemodes").getByRole("button", { name: "Survival" }).innerText()).split(" ").slice(0, 3).join(" "));
print("live-discord:", oneLine(await page.getByRole("link", { name: "Join our Discord" }).innerText()));
await snap(page, "1-live-home");
EOF
```

- **Expected.** Every source in `live-health` has a `lastSuccessAt`; the section header reads like `Gamemodes 3 online`; the Discord card ends with `<n> online, <n> members`; each mode card shows its own server's `players` value from `live-api`. The totals on the `Gamemodes` header, the header pill and the `Play with us` card count every server, the hub included, so they are larger than the sum of the mode cards.
- **live-offline.** Only provable when a server that has a card is down: its card then reads `Offline`. The `hub` and `event` servers have no card, so `event` being offline proves nothing. Do not fake it by editing hostnames; report it as not exercised.

## Gotchas

- Without `--live` every count reads `Checking` forever and `/healthz` has no `lastSuccessAt`. That is the default launch working as intended, not a failure.
- Real numbers change between the API call and the page render; a difference of a player or two is a race, not a bug.
- `/healthz` must never contain tokens, internal hostnames or stack traces; glance at the printed body.
- GitHub's unauthenticated API is rate limited per address. Repeated `--live` launches in a short time can leave `github` without a success; the page then omits the star count.
