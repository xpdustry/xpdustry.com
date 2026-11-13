# Team

The home page ends its sections with the team: one tile per teammate, with their face, their name in their highest tag's colour and their tags (Owner, Developer, Admin, Moderator). A tile opens a profile like Discord's, with a banner, a line about them where `src/brand/team.json` has one, and links to their GitHub account and site.

## Sub-features

- `team-grid` lists the teammates highest tag first, then by name, each tile a button named by the teammate and their tags.
- `team-profile` opens a dialog named after the teammate from their tile, with their tags, their line and their links.
- `team-links` opens the GitHub account and the site in a new tab with `rel="noopener"`: they are the team's, so they may know the visitor came from here.
- `team-close` closes the profile with its `Close` button, with Escape, or with a press outside it, and opening another closes the first.
- `team-about` shows the line in the page's language.
- `team-fit` keeps an open profile within the screen, scrolling inside itself when it is taller: `audit` opens every profile at each width and text setting.
- `team-discord` fills the grid from the Discord server's roles when the server runs with `XPD_DISCORD_TOKEN`; without it, as in every launch of this skill, the team is who `team.json` names and tags.

## How to get to it (user POV)

- Choose `Team` in the header, or scroll to the last section of the home page.
- Press a teammate's tile; press `Close`, Escape or elsewhere to dismiss the profile.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes. The grid is then `team.json`'s own team: ZetaMap, Maxou and phinner.

```sh
$V run team <<'EOF'
const page = await newPage({ width: 1280 });
await go(page, "/");
const team = page.locator("#team");
await team.scrollIntoViewIfNeeded();
const tiles = (await team.getByRole("listitem").getByRole("button").allInnerTexts()).map((tile) => tile.replaceAll("\n", " "));
// Maxou has no picture without Discord, so the first letter of their name stands in for it.
expect(tiles.join(" | ") === "ZetaMap Owner Developer | M Maxou Developer | phinner Developer", "team-grid", tiles.join(" | "));

await team.getByRole("button", { name: /^ZetaMap/ }).click();
const profile = page.getByRole("dialog", { name: "ZetaMap" });
await profile.waitFor();
const text = (await profile.innerText()).replaceAll("\n", " ");
expect(/Owner.*Developer.*Co-owns Chaotic Neutral/.test(text), "team-profile", text);
const links = await page.evaluate(() => [...document.querySelectorAll(":popover-open a")].map((a) => `${a.textContent.trim()} ${a.href} ${a.target} ${a.rel}`));
expect(
  links.join() === "GitHub https://github.com/ZetaMap _blank noopener,zetamap.fr https://zetamap.fr/ _blank noopener",
  "team-links",
  links.join(" | ")
);
await snap(page, "1-profile");

await page.keyboard.press("Escape");
expect(await profile.isHidden(), "team-close with Escape", await profile.isHidden());
await team.getByRole("button", { name: /^ZetaMap/ }).click();
await team.getByRole("button", { name: /^phinner/ }).click();
const open = await page.evaluate(() => [...document.querySelectorAll(":popover-open")].map((one) => one.querySelector("p").textContent));
expect(open.join() === "phinner", "team-close when another opens", open.join());
await page.getByRole("dialog", { name: "phinner" }).getByRole("button", { name: "Close" }).click();
expect((await page.getByRole("dialog").count()) === 0, "team-close with its button", await page.getByRole("dialog").count());

await go(page, "/fr");
await page.locator("#team").getByRole("button", { name: /^ZetaMap/ }).click();
const line = await page.getByRole("dialog", { name: "ZetaMap" }).innerText();
expect(/Propriétaire[\s\S]*Copropriétaire de Chaotic Neutral/.test(line), "team-about", line.replaceAll("\n", " "));

// team-fit: a phone held sideways under doubled text, where the profile is taller than the screen.
const phone = await newPage({ width: 667, height: 375, language: "fr" });
await go(phone, "/fr");
await phone.addStyleTag({ content: ":root { font-size: 200% }" });
await phone.locator("#team").getByRole("button", { name: /^ZetaMap/ }).click();
const sheet = phone.getByRole("dialog", { name: "ZetaMap" });
await sheet.waitFor();
const box = await sheet.boundingBox();
expect(box.y >= 0 && box.y + box.height <= 375 && box.x >= 0 && box.x + box.width <= 667, "team-fit within the screen", JSON.stringify(box));
const site = sheet.getByRole("link", { name: "zetamap.fr" });
await site.scrollIntoViewIfNeeded();
const link = await site.boundingBox();
expect(link.y >= box.y && link.y + link.height <= box.y + box.height, "team-fit scrolls to its links", JSON.stringify(link));
await snap(phone, "2-sideways");
EOF
```

- **Expected.** Nine lines, each starting with `ok`. The first screenshot shows ZetaMap's profile beside their tile, the second the profile filling a short screen with its links scrolled into view.

Variants:

- **Phone.** At `newPage({ width: 390 })` the profile is a sheet across the bottom of the screen over a dimmed page; the same checks hold.
- **Firefox.** `$V run team --browser firefox`: where the browser cannot anchor the profile to its tile, it opens in the middle of the screen.
- **team-discord.** Not reachable from a launch of this skill, which gives the server no token. `src/status/server/team.test.ts` covers it against a mocked Discord; with a real bot, start the built server with `XPD_DISCORD_TOKEN`, `XPD_DISCORD_GUILD` and the `XPD_TEAM_ROLE_*` variables and read the grid, and `/healthz` for `team.lastSuccessAt`.

## Gotchas

- A closed profile is in the page but hidden: `getByRole("dialog")` finds only the open one.
- The tile's accessible name is the teammate's name followed by their tags, so match its start (`/^ZetaMap/`), and translate nothing: names are not translated, tags are.
- The profile is a `popover`, so it sits in the top layer: `scrollIntoViewIfNeeded` on its content scrolls the profile, not the page.
- Read an open profile through `page.evaluate` and `:popover-open`, as the script does: `evaluateAll` on a locator inside the open dialog crashes the page in Playwright's Firefox, which the browser itself does not do.
- Faces served by Discord only appear with a token; the default launch shows the pictures in `public/` or the first letter of the name.
