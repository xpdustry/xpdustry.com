import sharp from "sharp";
import { FRINGES, PATCHES, SPREADS } from "../src/textures/cards.ts";
import { BACKDROP, CROWN, FADE, RIDGE } from "../src/textures/page.ts";
import { blobSprites, type TextureSettings } from "../src/textures/texture.ts";
import { renderTexture, toLabyrinth } from "./reticulate-render.ts";

export const ASSETS = new URL("../src/textures/assets/", import.meta.url);

/** A texture's file, under `src/textures/assets`, and what renders it: its settings at its size, if fixed. */
export interface Prerendered {
  file: string;
  settings: TextureSettings;
  width?: number;
  height?: number;
}

const unique = (textures: Prerendered[]) => [
  ...new Map(textures.map((texture) => [texture.file, texture])).values()
];

export const TEXTURES: readonly Prerendered[] = [
  ...Object.entries(BACKDROP).map(([layer, settings]) => ({
    file: `backdrop-${layer}.webp`,
    settings
  })),
  { file: "crown.webp", ...CROWN },
  { file: "ridge.webp", ...RIDGE },
  { file: "fade.webp", settings: FADE },
  ...unique(
    Object.values(PATCHES).flatMap((patches) =>
      blobSprites(patches).map(({ name, size, settings }) => ({
        file: `patches/${name}.webp`,
        settings,
        width: size,
        height: size
      }))
    )
  ),
  ...unique(
    Object.values(SPREADS).flatMap((spread) =>
      Object.values(spread).map(({ name, settings }) => ({
        file: `spread/${name}.webp`,
        settings
      }))
    )
  ),
  ...unique(
    FRINGES.map(({ name, settings, width, height }) => ({
      file: `fringe/${name}.webp`,
      settings,
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
export const render = ({ settings, width = 0, height = 0 }: Prerendered) =>
  renderTexture(labyrinth, settings, width, height);
