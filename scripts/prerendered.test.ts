import { readFileSync, readdirSync, statSync } from "node:fs";
import sharp from "sharp";
import { expect, test } from "vitest";
import { PATCHES } from "../src/textures/cards.ts";
import { blobSprites } from "../src/textures/texture.ts";
import { FRAMES, LOGO, renderLogoFrames, restingFrame } from "./logo-frames.ts";
import { ASSETS, RENDERED_FOLDERS, TEXTURES, readPixels, render } from "./prerendered.ts";
import { renderTexture, toLabyrinth } from "./reticulate-render.ts";

const pattern = await readPixels("reticulate.png");
const labyrinth = toLabyrinth(pattern.data, pattern.info.channels, pattern.info.width);

test.each(TEXTURES)("$file matches its settings", async (texture) => {
  const rendered = await render(texture);
  const file = await readPixels(texture.file).catch(() => undefined);
  expect(file, `${texture.file} is missing`).toBeDefined();
  expect([file!.info.width, file!.info.height]).toEqual([rendered.width, rendered.height]);
  expect(file!.data.equals(Buffer.from(rendered.pixels)), `${texture.file} is out of date`).toBe(
    true
  );
});

test.each(TEXTURES.filter(({ format }) => format === "pair"))(
  "$file decomposes both palette tones before resampling",
  async (texture) => {
    const masks = await render({ ...texture, density: 1 });
    const reference = renderTexture(
      labyrinth,
      { ...texture.settings, color: "#86d8cf", inner: "#a6e7e0" },
      texture.width ?? 0,
      texture.height ?? 0
    );
    let maxError = 0;
    for (let y = 0; y < reference.height; y++) {
      for (let x = 0; x < reference.width; x++) {
        const source = (y * reference.width + x) * 4;
        const outline = (y * masks.width + x) * 4 + 3;
        const alpha = masks.pixels[outline]! / 255;
        const mix = masks.pixels[outline + reference.width * 4]! / 255;
        for (const [channel, from, to] of [
          [0, 134, 166],
          [1, 216, 231],
          [2, 207, 224]
        ]) {
          const actual = (from! + (to! - from!) * mix) * alpha;
          const expected =
            (reference.pixels[source + channel!]! * reference.pixels[source + 3]!) / 255;
          maxError = Math.max(maxError, Math.abs(actual - expected));
        }
      }
    }
    expect(maxError).toBeLessThan(9);
  }
);

test("production masks reproduce the actual palettes after resampling", async () => {
  for (const patch of Object.values(PATCHES).filter(({ grow }) => grow)) {
    for (const sprite of blobSprites(patch)) {
      const texture = TEXTURES.find(({ file }) => file === `patches/${sprite.name}.webp`)!;
      const masks = await render(texture);
      const reference = await render({
        ...texture,
        format: "color",
        settings: { ...texture.settings, color: patch.color, inner: patch.inner }
      });
      const from = Buffer.from(patch.color.slice(1), "hex");
      const to = Buffer.from(patch.inner.slice(1), "hex");
      let maxError = 0;
      for (let index = 0; index < reference.width * reference.height; index++) {
        const source = index * 4;
        const outline =
          (Math.floor(index / reference.width) * masks.width + (index % reference.width)) * 4 + 3;
        const alpha = masks.pixels[outline]! / 255;
        const mix = masks.pixels[outline + reference.width * 4]! / 255;
        for (let channel = 0; channel < 3; channel++) {
          const actual = (from[channel]! + (to[channel]! - from[channel]!) * mix) * alpha;
          const expected =
            (reference.pixels[source + channel]! * reference.pixels[source + 3]!) / 255;
          maxError = Math.max(maxError, Math.abs(actual - expected));
        }
      }
      expect(maxError, `${sprite.name} in ${patch.color}`).toBeLessThan(9);
    }
  }
});

test("generated folders contain only the catalogue and keep its transfer budget", () => {
  for (const folder of RENDERED_FOLDERS) {
    expect(readdirSync(new URL(folder, ASSETS)).sort()).toEqual(
      TEXTURES.filter(({ file }) => file.startsWith(`${folder}/`))
        .map(({ file }) => file.slice(folder.length + 1))
        .sort()
    );
  }
  const bytes = TEXTURES.reduce((sum, { file }) => sum + statSync(new URL(file, ASSETS)).size, 0);
  expect(bytes).toBeLessThan(500_000);
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
