# Live status

The site shows who is playing: a count on every gamemode and on the `Play with us` card, the Discord server's online and member counts, the GitHub star total, and the team as Discord's roles make it. Tests run with status polling off, so they see none of it; only a live launch talks to the real Mindustry servers, Discord and GitHub. `tests/artifact/api.test.ts` covers what `/healthz` and `/api/servers` must never give away, and `src/status/server/team.test.ts` the team against a mocked Discord.

## How to get to it (user POV)

- Open the home page: the `Play with us` card, `Gamemodes` and the Discord card carry counts.
- Leave it open: the counts update without a reload.
- Scroll to `Team`: with a bot token the grid follows the Discord server's roles.

## Capturing it

`$V launch --live`, then `doctor`. The first poll takes a second or two: the script waits for every source to answer once, and fails after 20 s naming those that did not.

```sh
$V run live-status <<'EOF'
// Every source a live launch polls has answered once, or the run fails naming the ones that did not.
const SOURCES = ["servers", "discord", "github", "team"];
let health;
for (let tries = 1; ; tries++) {
  health = await (await get("/healthz")).json();
  const waiting = SOURCES.filter((source) => !health[source]?.lastSuccessAt);
  if (waiting.length === 0) break;
  if (tries === 40) throw new Error(`no answer in 20 s from ${waiting.join(", ")}: ${JSON.stringify(health)}`);
  await new Promise((resolve) => setTimeout(resolve, 500));
}
print("health:", JSON.stringify(health));
print("servers:", await (await get("/api/servers")).text());
const page = await newPage({ width: 1280 });
await go(page, "/");
// A card's count is plain text; its `status` is the copy confirmation, empty until a copy.
const count = /^(\d+ online|Offline|Checking)$/;
print("Gamemodes:", await page.locator("#gamemodes header").getByText(count).innerText());
for (const card of await page.locator("#gamemodes").getByRole("listitem").all()) {
  print(`${await card.getByRole("heading").innerText()}:`, await card.getByText(count).innerText());
}
print("Play with us:", await page.locator("#servers").getByText(count).innerText());
await snap(page, "live-home");
await page.locator("#team").scrollIntoViewIfNeeded();
await snap(page, "live-team");
EOF
```

For the team as Discord lists it, the server needs `XPD_DISCORD_TOKEN`, `XPD_DISCORD_GUILD` and the `XPD_TEAM_ROLE_*` variables from the README in the environment of `launch`.

## What to judge

- The script passed its wait: every source in `/healthz` has a `lastSuccessAt`. GitHub's unauthenticated API is rate limited per address, so repeated live launches can fail the wait on `github`; report that, and that the page then omits the star count.
- The `Gamemodes` count, each mode card's count against its server's `players` in `/api/servers`, and the `Play with us` count: both totals count every server, the hub included. A player or two of difference is a race between the two reads.
- The Discord card ends with `<n> online, <n> members`.
- A server that has a card and does not answer reads `Offline`. Do not fake it by editing hostnames; when every server answers, report it as not exercised.
- `/healthz` shows no token, internal hostname or stack trace.
- With a bot token, the team matches the Discord roles, faces come from `/discord/…`, and `/healthz` has `team.lastSuccessAt`.
