# Copy a server address

A press on a gamemode card or the `Play with us` card grows a spread of the card's colour from where it landed, out past the farthest corner, and once `Copied` is over dissolves it back into threads. `tests/e2e/copy.test.ts` proves what is copied and announced, and `spread.test.ts` how a spread grows, starts over and goes, in both browsers. Whether it feels right needs eyes.

## How to get to it (user POV)

- Scroll to `Gamemodes` and press a card, then press it again quickly, and again while its colour dissolves.
- Press anywhere on the `Play with us` card.

## Capturing it

Default launch, `doctor` passes. Record one visit in each browser:

```sh
$V run spread <<'EOF'
const page = await newPage({ width: 1280, motion: true, record: true });
await go(page, "/");
const card = page.locator("#gamemodes").getByRole("listitem").filter({ hasText: "PvP" });
await card.scrollIntoViewIfNeeded();
const box = await card.boundingBox();
const press = (x) => card.getByRole("button").click({ position: { x: box.width * x, y: box.height / 2 } });
await press(0.1);
await page.waitForTimeout(300);
await press(0.9);
await page.waitForTimeout(1900);
await press(0.5);
await page.waitForTimeout(3000);
EOF
```

Repeat with `--browser firefox`, and at `width: 390`.

## What to judge

The video is in the evidence folder. The spread starts at the press, reaches the far corner without a jump, and dissolves solid first, then the thick threads, then the thin ones. A second press grows over the first without a flash; the first fades beneath. Nothing flickers at the card's edges.
