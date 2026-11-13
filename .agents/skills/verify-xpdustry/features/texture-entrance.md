# Texture entrance

The first screen's textures come in as the page loads: the crown drops in, the backdrop's two layers fade in, then each card's blobs grow from threads that fuse, card by card. Only textures wait, never content, and a visitor who gets no entrance (reduced motion, no scripts, an old browser, a stalled image) sees every texture painted as usual.

## Sub-features

- `enter-order` gives each entrance an earliest turn after the page is parsed: the crown at 0 ms, the backdrop's layers at 80 and 220 ms, the blobs from 220 ms, each card 110 ms after the one before and each blob 70 ms after the one before.
- `enter-grows` shows blobs still in their threads 600 ms in: the growth is long enough to be seen.
- `enter-opens` opens each hover sprite to its resting size before its entrance ends.
- `enter-first-screen` animates only textures whose card is on the first screen.
- `enter-started`, `enter-settles` leave nothing behind: no entrance still waiting, no hidden texture, no threads mask, no held animation, no `data-enter` on `<html>`.
- `enter-hover` keeps the hover growth of a card's blobs working once the entrance is over.
- `enter-below` leaves textures below the first screen painted and never animated.
- `enter-still` leaves the gamemode bands' frayed edges and the footer's ridge unmarked, so they paint with the page.
- `enter-reduced`, `enter-no-api`, `enter-no-scripts` play no entrance and hide nothing.
- `enter-stalled` holds a texture whose image never arrives, then releases every texture after 4 seconds.

## How to get to it (user POV)

- Open or reload the home page and watch the first second.
- Scroll to the footer, then hover the `Play with us` card.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes. Run it in both browsers: `$V run entrance` and `$V run entrance --browser firefox`. Each takes about half a minute.

```sh
$V run entrance <<'EOF'
const expect = (ok, what, seen) => {
  print(ok ? "ok  " : "FAIL", what, seen ?? "");
  if (!ok) throw new Error(what);
};
// A texture is stuck while it is invisible, still masked by the threads, or held by an entrance.
const stuck = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-texture]")]
      .filter((element) => {
        const { opacity, maskImage } = getComputedStyle(element);
        const held = element
          .getAnimations({ subtree: true })
          .some((animation) => animation.constructor.name === "Animation");
        return opacity === "0" || maskImage.includes("threads") || held;
      })
      .map((element) => element.dataset.texture)
      .concat("enter" in document.documentElement.dataset ? ["data-enter"] : [])
  );
// Records every entrance: its kind and layer, its card and its place among the card's blobs, and
// whether the card was on the first screen. `turn` is the earliest it may begin, in ms after the
// page is parsed: the crown at 0, the backdrop's layers at 80 and 220, then the blobs from 220,
// each card 110 after the one before and each blob 70 after the one before, up to four.
const record = (page) =>
  page.addInitScript(() => {
    window.entrances = [];
    addEventListener("DOMContentLoaded", () => (window.parsed = performance.now()));
    const turns = { drop: 0, "backdrop::before": 80, "backdrop::after": 220 };
    const cards = new Map();
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const animation = animate.call(this, frames, options);
      const texture = this.dataset.texture;
      if (!texture) return animation;
      const kind = texture + (options.pseudoElement ?? "");
      const card = this.closest(".reveal");
      const { top, bottom } = (card ?? this).getBoundingClientRect();
      if (card && !cards.has(card)) cards.set(card, { at: cards.size, blobs: 0 });
      const { at = 0, blobs = 0 } = cards.get(card) ?? {};
      if (card && texture === "grow") cards.get(card).blobs++;
      const blob = Math.min(texture === "grown" ? blobs - 1 : blobs, 4);
      window.entrances.push({
        animation,
        element: this,
        kind,
        card: card ? at : null,
        shown: bottom > 0 && top < innerHeight,
        turn: turns[kind] ?? 220 + at * 110 + blob * 70
      });
      return animation;
    };
  });
const entrances = (page) =>
  page.evaluate(() =>
    window.entrances.map(({ animation, kind, card, shown, turn }) => ({
      kind,
      card,
      shown,
      turn,
      // An entrance that has not started is still waiting for its image.
      begins:
        animation.startTime === null
          ? null
          : Math.round(animation.startTime + animation.effect.getTiming().delay - window.parsed)
    }))
  );

for (const width of [1280, 390]) {
  let page = await newPage({ width, motion: true });
  await record(page);
  await go(page, "/"); // fills the cache: a late image would begin late and hide a turn that is too early
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => performance.now() - window.parsed > 600);
  const growing = await page
    .locator("[data-texture=grow]")
    .evaluateAll((blobs) => blobs.filter((blob) => getComputedStyle(blob).maskImage.includes("threads")).length);
  expect(growing > 0, `${width} enter-grows`, `${growing} blobs in threads 600 ms in`);
  await snap(page, `${width}-1-entering`);
  await page.waitForTimeout(2500);

  const played = await entrances(page);
  const kinds = [...new Set(played.map((entry) => entry.kind))].sort().join(" ");
  expect(kinds === "backdrop::after backdrop::before drop grow grown", `${width} enter-kinds`, kinds);
  expect(played.every((entry) => entry.shown), `${width} enter-first-screen`, `${played.length} entrances`);
  const waiting = played.filter((entry) => entry.begins === null).map((entry) => entry.kind);
  expect(waiting.length === 0, `${width} enter-started`, waiting);
  const early = played.filter((entry) => entry.begins < entry.turn - 5);
  const seen = (list) => list.map(({ kind, card, begins, turn }) => `${kind}${card === null ? "" : ` card ${card}`} ${begins}>=${turn}`).join(", ");
  expect(early.length === 0, `${width} enter-order`, seen(early.length ? early : played));
  expect(new Set(played.map((entry) => entry.card)).size > 2, `${width} enter-order has several cards`);
  expect((await stuck(page)).length === 0, `${width} enter-settles`, await stuck(page));
  await snap(page, `${width}-2-settled`);

  // A grown sprite opens during its entrance: seek each one to nine tenths and read how far it is.
  const opened = await page.evaluate(() =>
    window.entrances
      .filter((entry) => entry.kind === "grown")
      .map(({ animation, element }) => {
        const { delay, duration } = animation.effect.getTiming();
        animation.currentTime = delay + duration * 0.9;
        const grow = Number(getComputedStyle(element).getPropertyValue("--grow"));
        animation.finish();
        return grow;
      })
  );
  expect(opened.length > 0 && opened.every((grow) => grow > 0.2 && grow <= 0.45), `${width} enter-opens`, opened.join(" "));

  // The play card is on the first screen, so its grown sprites came through the entrance.
  const play = page.locator("#servers");
  const grown = () =>
    play
      .locator("[data-texture=grown]")
      .evaluateAll((sprites) => sprites.map((sprite) => getComputedStyle(sprite).getPropertyValue("--grow")));
  expect((await grown()).every((grow) => grow === "0.45"), `${width} enter-hover rests`, (await grown()).join(" "));
  await play.hover({ position: { x: 24, y: 24 } });
  await page.waitForTimeout(1300);
  expect((await grown()).every((grow) => grow === "1"), `${width} enter-hover`, (await grown()).join(" "));

  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  expect((await stuck(page)).length === 0, `${width} enter-below`, await stuck(page));
  expect((await entrances(page)).length === played.length, `${width} enter-below adds none`);
  const still = await page.evaluate(() => ({
    edges: document.querySelectorAll("#gamemodes img").length,
    ridge: document.querySelectorAll("footer > div[aria-hidden]").length,
    marked: document.querySelectorAll("#gamemodes [data-texture], footer [data-texture]").length
  }));
  expect(still.edges > 0 && still.ridge === 1 && still.marked === 0, `${width} enter-still`, still);
  await snap(page, `${width}-3-footer`);

  page = await newPage({ width });
  await record(page);
  await go(page, "/");
  expect((await entrances(page)).length === 0, `${width} enter-reduced plays none`);
  expect((await stuck(page)).length === 0, `${width} enter-reduced`, await stuck(page));

  page = await newPage({ width, motion: true });
  await page.addInitScript(() => delete Element.prototype.animate);
  await go(page, "/");
  expect((await stuck(page)).length === 0, `${width} enter-no-api`, await stuck(page));

  if (browser.browserType().name() === "chromium") {
    page = await newPage({ width, motion: true, scripts: false });
    await go(page, "/");
    expect((await stuck(page)).length === 0, `${width} enter-no-scripts`, await stuck(page));
    await snap(page, `${width}-4-no-scripts`);
  }

  page = await newPage({ width, motion: true });
  await page.route(/\.webp$/, () => {}); // every image stalls: never answered, never failed
  await page.goto(base, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  expect((await stuck(page)).length > 0, `${width} enter-stalled holds while it waits`);
  await page.waitForTimeout(3500);
  expect((await stuck(page)).length === 0, `${width} enter-stalled releases`, await stuck(page));
}
EOF
```

- **Expected.** Every line starts with `ok`: 38 in Chromium, 36 in Firefox. A failed check throws and names itself. `enter-order` prints each entrance as `<kind> [card n] <began>>=<turn>`, in ms after parsing. `<width>-1-entering.png` is the page 600 ms in, `<width>-2-settled.png` the page after the entrance.

Variants:

- **A recording.** Replace the first `newPage` call with `newPage({ width, motion: true, record: true })`. The videos land in the evidence folder when the run ends, one per width.
- **Other pages.** `/blog` and a post (take its path from a link on `/blog`) have an entrance too. Replace `go(page, "/")` with `go(page, "/blog")` and `page.goto(base, …)` with `page.goto(base + "/blog", …)`, and delete the `enter-opens`, `enter-hover` and `enter-still` blocks, which name home page elements.
- **Back navigation.** Insert after the `enter-settles` snap:

  ```js
  await go(page, "/blog");
  await page.goBack({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  expect(new URL(page.url()).pathname === "/", `${width} enter-back returns home`, page.url());
  expect((await stuck(page)).length === 0, `${width} enter-back`, await stuck(page));
  ```

## Gotchas

- `newPage` reduces motion unless it gets `motion: true`. Without it no entrance plays and the run fails at `enter-grows`.
- `go` waits for the network to settle, which a stalled image never lets happen, and by then most of the entrance is over. The entrance blocks use `page.reload` or `page.goto` with `waitUntil: "domcontentloaded"` instead.
- A late image delays its own texture only, so `enter-order` checks earliest turns, never a fixed order. The script reloads on a filled cache to keep images from hiding a turn that is too early; even so an entrance begins 25 to 100 ms after its turn, so a turn brought forward by less than that passes.
- When you change a turn, a stagger or the way cards are counted in `src/shell/enter.ts`, change `record` in the script to match: it computes the same turns.
- `enter-no-scripts` runs in Chromium only: Playwright cannot evaluate in a Firefox page whose scripts are off, and `newPage({ scripts: false })` refuses there.
- The hover growth is a CSS transition on `--grow`, from `0.45` at rest to `1`. `stuck` counts only script animations as held, so a transition in flight is not a stuck texture.
