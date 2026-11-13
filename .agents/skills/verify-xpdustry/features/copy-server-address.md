# Copy a server address

Mindustry has no join links, so the site's main action is copying a server address to paste into the game. Every address on the page is a copy button that says what happened: copied only once the browser took it, and otherwise a red failure with the address left as selectable text.

## Sub-features

- `copy-mode` copies a gamemode server's address from its card in `Gamemodes`.
- `copy-hub` copies the hub address from a press anywhere on the `Play with us` card.
- `copy-pill` copies the hub address from the header pill, which every page except the landing page shows.
- `copy-confirm` shows a confirmation on the control and announces it to screen readers with the paste instructions.
- `copy-fit` falls back to the short confirmation (`Copied`) when the long one does not fit the card.
- `copy-failed` handles a refused write: the chip or pill turns red with a cross, screen readers hear `Could not copy. The address is …`, and the address is shown as text one click selects (on the gamemode card it replaces the player count; below 780px the pill shows it on two lines). Browsers without `navigator.clipboard`, as on plain http, fail the same way.
- `copy-spread` grows a spread of the card's colour from where the press landed, from nothing out past the card's farthest corner, and fades it away once `Copied` is over.
- `copy-respread` plays the spread again from each new press, even before the last one has settled or while it fades: the new one grows from nothing over the old one, which carries on as it was (growing, or fading at its size) beneath.

## How to get to it (user POV)

- Scroll to `Gamemodes` on the home page and choose a mode card (Survival, PvP, Attack, Tower Defense, Sandbox).
- Press anywhere on the `Play with us` card at the top of the home page.
- Press a card again, quickly or while its colour fades, to see the spread start over.
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
      writeText: real.writeText.bind(real)
    };
    Object.defineProperty(real, "writeText", {
      value: () => Promise.reject(new DOMException("Denied", "NotAllowedError"))
    });
  });
  ```

  For a missing API, replace the body with `Object.defineProperty(Navigator.prototype, "clipboard", { get: () => undefined })`: the copy must fail the same way. Expected: `#servers output` reads `Could not copy. The address is hub.md.xpdustry.com.`, clicking `#servers h2 + span` leaves `getSelection().toString()` equal to the address, and the header pill on `/blog` shows the address at 320px without squeezing the logo.

- **copy-spread, copy-respread.** Run this whenever `src/textures/Spread.tsx`, `Spread.css.ts` or the copy press changes. It samples every spread on the PvP card each animation frame and checks how they grow and fade, in both browsers: `$V run copy-spread` and `$V run copy-spread --browser firefox`. Every line starts with `ok`, nine in all, in about 15 seconds.

  ```js
  const page = await newPage({ width: 1280, motion: true });
  await go(page, "/");
  const card = page.locator("#gamemodes li").filter({ hasText: "PvP" }).first();
  await card.scrollIntoViewIfNeeded();
  const cover = card.getByRole("button").first();
  const box = await card.boundingBox();
  // A press at a fraction of the card's width, halfway down, and the size its spread grows to.
  const at = (fraction) => ({ position: { x: box.width * fraction, y: box.height / 2 } });
  const full = (fraction) => {
    const x = box.width * fraction;
    const y = box.height / 2;
    return Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 120;
  };
  // Every animation frame, each spread on the card: which element (`play`, in order of
  // appearance), whether a newer one covers it, its size (`--spread`, px) and its opacity.
  await card.evaluate((li) => {
    const ids = new WeakMap();
    let count = 0;
    window.spreadFrames = [];
    const sample = () => {
      for (const spread of li.querySelectorAll("[data-spread]")) {
        if (!ids.has(spread)) ids.set(spread, count++);
        const style = getComputedStyle(spread);
        window.spreadFrames.push({
          at: Math.round(performance.now()),
          play: ids.get(spread),
          role: spread.dataset.spread,
          size: Math.round(parseFloat(style.getPropertyValue("--spread"))),
          opacity: Number(Number(style.opacity).toFixed(2))
        });
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  const frames = () => page.evaluate(() => window.spreadFrames.splice(0));
  const visible = (list) => list.filter((frame) => frame.opacity > 0.05);
  const plays = (list) => [...new Set(list.map((frame) => frame.play))];
  const of = (list, play) => list.filter((frame) => frame.play === play);
  const role = (list, name) => list.filter((frame) => frame.role === name);
  // The newest spread with that role: until a press has mounted its own, the last one is still
  // current, and an older, settled one can still be fading beneath.
  const newest = (list, name) => of(list, Math.max(...plays(role(list, name))));
  const sizes = (list) => list.map((frame) => frame.size);
  const grows = (list) => sizes(list).every((size, i, all) => i === 0 || size >= all[i - 1]);

  // copy-spread: one press grows a spread from nothing to past the card's farthest corner.
  await frames();
  await cover.click(at(0.05));
  await page.waitForTimeout(1100);
  let seen = visible(await frames());
  expect(seen[0].size < full(0.05) * 0.4, "copy-spread starts small", seen[0].size);
  expect(grows(seen), "copy-spread only grows", sizes(seen).join(" "));
  expect(
    Math.abs(seen.at(-1).size - full(0.05)) < 3,
    "copy-spread reaches the far corner",
    `${seen.at(-1).size} of ${Math.round(full(0.05))}`
  );

  // copy-respread, still growing: a press in the middle of the growth starts a new spread from
  // nothing over the last one, which carries on growing as it fades away.
  await cover.click(at(0.05));
  await page.waitForTimeout(200);
  await frames();
  await cover.click(at(0.95));
  await page.waitForTimeout(1100);
  seen = visible(await frames());
  let over = newest(seen, "current");
  let under = newest(seen, "covered");
  expect(
    over[0].size < full(0.95) * 0.4,
    "copy-respread starts small over a growing one",
    over[0].size
  );
  expect(grows(under), "copy-respread lets the covered one keep growing", sizes(under).join(" "));
  expect(
    under.length > 0 && over.at(-1).opacity === 1,
    "copy-respread fades the covered one out beneath"
  );

  // copy-respread, fading: once "Copied" is over the spread fades; a press then grows a new one,
  // and the fading one keeps its size rather than growing again from nothing.
  await page.waitForFunction(
    (li) => {
      const opacity = Number(getComputedStyle(li.querySelector('[data-spread="current"]')).opacity);
      return opacity > 0.3 && opacity < 0.8;
    },
    await card.elementHandle(),
    { polling: 16 }
  );
  await frames();
  await cover.click(at(0.5));
  await page.waitForTimeout(1100);
  seen = await frames();
  over = newest(visible(seen), "current");
  // Every frame of it, as it may be all but faded away once the new one mounts.
  under = newest(seen, "covered");
  expect(
    over[0].size < full(0.5) * 0.4,
    "copy-respread starts small over a fading one",
    over[0].size
  );
  expect(
    under.length > 0 && new Set(sizes(under)).size === 1,
    "copy-respread leaves a fading one at its size",
    sizes(under).slice(0, 8).join(" ")
  );
  await snap(page, "respread");

  await page.waitForTimeout(2600);
  seen = await frames();
  const last = plays(seen).map((play) => of(seen, play).at(-1).opacity);
  expect(
    last.every((opacity) => opacity === 0),
    "copy-spread fades away once copied is over",
    last.join(" ")
  );
  ```

## Gotchas

- The confirmation clears itself after a few seconds; snap right after the clipboard check. A failure stays until the next press.
- With the default launch every count reads `Checking`. That is correct here; counts belong to [live status](live-status.md).
- The clipboard only works because `newPage` grants the permission. A hand-made context without it makes the button show its failure message instead.
- The spread checks read frames, never a moment after a fixed wait: a press lands only once the clipboard has answered, so until the new spread mounts the last one is still `current`, and one that was fading may be all but gone by then. `newest` and the fade window in the script are there for that.
- `Copied` lasts 1.8 seconds (`COPIED_MS` in `src/ui/copy/useCopy.ts`) and the fade 0.55 more; a spread whose opacity is between 0 and 1 is fading in during its first 0.1 seconds and fading out after that. The script catches the fade-out by waiting it out after the last press, not by its opacity alone.
