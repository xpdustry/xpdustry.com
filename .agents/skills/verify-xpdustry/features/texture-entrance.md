# Texture entrance

The first screen's textures come in as the page loads: the crown drops in, the backdrop's two layers fade in, then each card's blobs grow from threads that fuse, card by card. Each gamemode row's colour waits for its ridge, then spreads in behind it, row by row: from the left on a wide row, from the top on a narrow one, where the ridge is the fringe below. A post tile's torn edge rises out of the straight edge under its title. A row's colour waits for both of its edges, wherever the row is: one scrolled to before the painter delivers stays pale, then slides in if it is in view. With less motion, or once a visitor asks for less motion mid-entrance, the colour shows at rest once painted and nothing moves. The large logo sends a band of threads across the introduction when pressed. `tests/e2e/entrance.test.ts` and `spread.test.ts` prove what comes in, that it passes through its threads, that nothing stays hidden, and how the wave sweeps, in both browsers. Whether the motion reads as one calm sequence, and whether the growth is long enough to be seen, needs eyes.

## How to get to it (user POV)

- Open or reload the home page and watch the first second.
- Press the large Xpdustry logo in the introduction card, then again while its wave is still crossing.
- Scroll to the gamemodes on a phone width and reload: the rows enter where the page comes back to.

## Capturing it

Default launch, `doctor` passes. Record one visit per width, in each browser:

```sh
$V run entrance <<'EOF'
for (const width of [1280, 390]) {
  const page = await newPage({ width, motion: true, record: true });
  await go(page, "/");
  await page.reload();
  await page.waitForTimeout(2500);
  const logo = page.getByRole("button", { name: "Xpdustry", exact: true });
  await logo.click();
  await page.waitForTimeout(300);
  await logo.click();
  await page.waitForTimeout(2000);
}
EOF
```

Repeat with `--browser firefox`. The reload plays the entrance on a filled cache, as a returning visitor sees it. To see what arrives with the painter, hold its worker back before the visit: `await page.route(/painter\.worker/, async (route) => { await new Promise((done) => setTimeout(done, 600)); await route.continue(); });`

## What to judge

- The crown settles first, the backdrop follows, then the cards, top to bottom, each blob a moment after the one before. No card's blobs pop in at once or out of turn.
- A blob is visibly threads before it fuses: the growth is long enough to read.
- Content never waits: text and buttons are there from the first frame.
- No gamemode row shows a straight-edged colour or jumps to its width: it is pale, then its colour spreads in with the ridge or fringe leading.
- Scroll to the gamemodes on a phone width before the painter delivers, and resize from wide to narrow mid-entrance: still no straight-edged colour.
- The logo's band sweeps out from the press and off the card, and a second press starts a second band without stopping the first.
