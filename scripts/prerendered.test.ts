import { readFileSync } from "node:fs";
import sharp from "sharp";
import { expect, test } from "vitest";
import { FRAMES, LOGO, renderLogoFrames, restingFrame } from "./logo-frames.ts";
import { TEXTURES, readPixels, render } from "./prerendered.ts";

test.each(TEXTURES)("$file matches its settings", async (texture) => {
  const rendered = render(texture);
  const file = await readPixels(texture.file).catch(() => undefined);
  expect(file, `${texture.file} is missing`).toBeDefined();
  expect([file!.info.width, file!.info.height]).toEqual([rendered.width, rendered.height]);
  expect(file!.data.equals(Buffer.from(rendered.pixels)), `${texture.file} is out of date`).toBe(
    true
  );
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
