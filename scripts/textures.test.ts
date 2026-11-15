import { readFileSync } from "node:fs";
import sharp from "sharp";
import { expect, test } from "vitest";
import { readLabyrinthPixels, readPattern, readPixels } from "./labyrinth.ts";
import { FRAMES, LOGO, renderLogoFrames, restingFrame } from "./logo-frames.ts";

test("the labyrinth the browser gets is the pattern, give or take its encoding", async () => {
  const pattern = await readPattern();
  const labyrinth = await readLabyrinthPixels();
  expect(labyrinth.size, "labyrinth.avif is out of date").toBe(pattern.size);
  let squares = 0;
  for (let at = 0; at < pattern.data.length; at++) {
    squares += (pattern.data[at]! - labyrinth.data[at]!) ** 2;
  }
  // Another encoder build may differ by a value here and there; another pattern is far off.
  const error = Math.sqrt(squares / pattern.data.length);
  expect(error, "labyrinth.avif is out of date").toBeLessThan(4);
});

test("the logo's frames match the logo", { timeout: 60_000 }, async () => {
  const rendered = await renderLogoFrames(readFileSync(LOGO, "utf8"));
  const file = await readPixels("logo-frames.webp", FRAMES);
  expect([file.info.width, file.info.height]).toEqual([rendered.width, rendered.height]);
  expect(file.data.equals(rendered.pixels), "logo-frames.webp is out of date").toBe(true);

  const resting = await sharp(rendered.pixels, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 }
  })
    .extract(restingFrame())
    .raw()
    .toBuffer();
  const relief = await readPixels("logo-relief.webp", FRAMES);
  expect(relief.data.equals(resting), "logo-relief.webp is out of date").toBe(true);
});
