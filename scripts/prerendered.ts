import sharp from "sharp";
import { FRINGES, PATCHES } from "../src/textures/cards.ts";
import { BACKDROP, CROWN, FADE, RIDGE, THREADS } from "../src/textures/page.ts";
import { SPREAD_MASKS, blobSprites, type TextureSettings } from "../src/textures/texture.ts";
import { renderTexture, toLabyrinth } from "./reticulate-render.ts";

export const ASSETS = new URL("../src/textures/assets/", import.meta.url);

/** A texture's file, under `src/textures/assets`, and what renders it: its settings at its size, if fixed. */
export interface Prerendered {
  file: string;
  settings: TextureSettings;
  width?: number;
  height?: number;
  /** A pair packs the outline on the left and the inner-colour mix on the right. */
  format: "color" | "mask" | "core" | "pair";
  density?: number;
}

const unique = (textures: Prerendered[]) => [
  ...new Map(textures.map((texture) => [texture.file, texture])).values()
];

export const TEXTURES: readonly Prerendered[] = [
  ...Object.entries(BACKDROP).map(([layer, settings]) => ({
    file: `backdrop-${layer}.webp`,
    settings,
    format: "color" as const,
    density: 0.5
  })),
  { file: "crown.webp", ...CROWN, format: "color" },
  { file: "ridge.webp", ...RIDGE, format: "color" },
  { file: "fade.webp", settings: FADE, format: "color" },
  { file: "threads.webp", settings: THREADS, format: "mask" },
  ...unique(
    Object.values(PATCHES).flatMap((patches) =>
      blobSprites(patches).map(({ name, size, settings, kind }) => ({
        file: `patches/${name}.webp`,
        settings,
        format: kind === "raster" ? ("color" as const) : ("pair" as const),
        density: 0.75,
        width: size,
        height: size
      }))
    )
  ),
  { file: "spread/thick.webp", settings: SPREAD_MASKS.thick, format: "mask" },
  { file: "spread/core.webp", settings: SPREAD_MASKS.solid, format: "core" },
  ...unique(
    FRINGES.map(({ name, settings, width, height }) => ({
      file: `fringe/${name}.webp`,
      settings: { ...settings, color: "#ffffff" },
      format: "mask" as const,
      width,
      height
    }))
  )
];

/** The folders that only hold textures from `TEXTURES`, so files nothing renders are deleted. */
export const RENDERED_FOLDERS = ["patches", "spread", "fringe"] as const;

/** Decodes an asset into RGBA pixels. */
export const readPixels = (file: string, folder: URL = ASSETS) =>
  sharp(new URL(file, folder).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const reticulate = await readPixels("reticulate.png");
const labyrinth = toLabyrinth(reticulate.data, reticulate.info.channels, reticulate.info.width);

/** Renders a texture into RGBA pixels. */
export async function render({
  settings,
  width = 0,
  height = 0,
  format,
  density = 1
}: Prerendered) {
  const rendered = renderTexture(labyrinth, settings, width, height);
  const w = Math.round(rendered.width * density);
  const h = Math.round(rendered.height * density);
  const pixels = await sharp(rendered.pixels, {
    raw: { width: rendered.width, height: rendered.height, channels: 4 }
  })
    .resize(w, h, { kernel: sharp.kernel.linear })
    .raw()
    .toBuffer();
  const outputWidth = format === "pair" ? w * 2 : w;
  const output = Buffer.alloc(outputWidth * h * 4);
  const quantize = (value: number) => Math.round(value / 17) * 17;
  for (let index = 0; index < w * h; index++) {
    const at = index * 4;
    const dest = (Math.floor(index / w) * outputWidth + (index % w)) * 4;
    for (let c = 0; c < 3; c++)
      output[dest + c] =
        format === "color" ? Math.min(255, Math.round(pixels[at + c]! / 2) * 2) : 255;
    output[dest + 3] = quantize(pixels[at + (format === "core" ? 0 : 3)]!);
    if (format === "pair") {
      const core = dest + w * 4;
      output[core] = output[core + 1] = output[core + 2] = 255;
      output[core + 3] = quantize(pixels[at]!);
    }
  }
  return { pixels: output, width: outputWidth, height: h };
}
