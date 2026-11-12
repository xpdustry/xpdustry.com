# Copy a server address

Mindustry has no join links, so the site's main action is copying a server address to paste into the game. Every address on the page is a copy button that says what happened: copied only once the browser took it, and otherwise a red failure with the address left as selectable text.

## Sub-features

- `copy-mode` copies a gamemode server's address from its card in `Gamemodes`.
- `copy-hub` copies the hub address from a press anywhere on the `Play with us` card.
- `copy-pill` copies the hub address from the header pill, which every page except the landing page shows.
- `copy-confirm` shows a confirmation on the control and announces it to screen readers with the paste instructions.
- `copy-fit` falls back to the short confirmation (`Copied`) when the long one does not fit the card.
- `copy-failed` handles a refused write: the chip or pill turns red with a cross, screen readers hear `Could not copy. The address is …`, and the address is shown as text one click selects (on the gamemode card it replaces the player count; below 780px the pill shows it on two lines). Browsers without `navigator.clipboard`, as on plain http, fail the same way.

## How to get to it (user POV)

- Scroll to `Gamemodes` on the home page and choose a mode card (Survival, PvP, Attack, Tower Defense, Sandbox).
- Press anywhere on the `Play with us` card at the top of the home page.
- Choose the pill in the header showing `hub.md.xpdustry.com`, on the blog or any page other than the landing page.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes.

```sh
$V run copy-address <<'EOF'
const clipboard = (page) => page.evaluate(() => navigator.clipboard.readText());
const page = await newPage({ width: 1280 });
await go(page, "/");
const modes = page.locator("#gamemodes");
await modes.getByRole("button", { name: "Survival" }).click();
await page.waitForFunction(() => navigator.clipboard.readText().then((t) => t === "survival.md.xpdustry.com"));
print("copy-mode:", await clipboard(page));
print("copy-confirm:", await modes.locator("output").first().innerText());
await snap(page, "1-survival-copied");

await page.locator("#servers").click({ position: { x: 24, y: 24 } }); // a corner of the card, away from its button
await page.waitForFunction(() => navigator.clipboard.readText().then((t) => t === "hub.md.xpdustry.com"));
print("copy-hub:", await clipboard(page));
await snap(page, "2-hub-copied");
print("no pill on the landing page:", await page.getByRole("banner").getByRole("button", { name: /^Copy/ }).count()); // 0

await go(page, "/blog");
await page.getByRole("banner").getByRole("button", { name: "Copy hub.md.xpdustry.com" }).click();
await page.waitForFunction(() => navigator.clipboard.readText().then((t) => t === "hub.md.xpdustry.com"));
print("copy-pill:", await clipboard(page));
await snap(page, "3-pill-copied");
EOF
```

- **Expected.** `copy-mode` prints `survival.md.xpdustry.com`; `copy-confirm` prints `Copied survival.md.xpdustry.com. Paste it in Play, Join game, Add server.`; the first screenshot shows a tick on the Survival card.
  Variants:

- **Other languages.** Use `await go(page, "/fr")` and the French mode name (`Survie`). The announced path must match the game's own menu: `Jouer, Rejoindre une partie, Ajouter un serveur` and `Играть, Сетевая игра, Добавить сервер`.
- **copy-fit.** Repeat at `newPage({ width: 390 })` and snap: the card shows the short `Copied` and nothing is cut mid-word.
- **copy-failed.** Make the browser refuse before the page loads, then press each surface and check that nothing reached the clipboard, the announcement, and that a click on the address selects it:

  ```js
  await page.addInitScript(() => {
    const real = navigator.clipboard;
    window.realClipboard = {
      readText: () => real.readText(),
      writeText: real.writeText.bind(real),
    };
    Object.defineProperty(real, "writeText", {
      value: () => Promise.reject(new DOMException("Denied", "NotAllowedError")),
    });
  });
  ```

  For a missing API, replace the body with `Object.defineProperty(Navigator.prototype, "clipboard", { get: () => undefined })`: the copy must fail the same way. Expected: `#servers output` reads `Could not copy. The address is hub.md.xpdustry.com.`, clicking `#servers h2 + span` leaves `getSelection().toString()` equal to the address, and the header pill on `/blog` shows the address at 320px without squeezing the logo.

## Gotchas

- The confirmation clears itself after a few seconds; snap right after the clipboard check. A failure stays until the next press.
- With the default launch every count reads `Checking`. That is correct here; counts belong to [live status](live-status.md).
- The clipboard only works because `newPage` grants the permission. A hand-made context without it makes the button show its failure message instead.
