import sharp from "sharp";
import {
  DEPTH,
  LOGO_FRAME_SHEET,
  LIFT,
  frameIndex,
  frameOffset,
  frameRect
} from "../src/lib/logo.ts";

/** The logo the frames are drawn from, and the folder the frames are written to. */
export const LOGO = new URL("../src/assets/logo.svg", import.meta.url);
export const FRAMES = new URL("../src/assets/", import.meta.url);

const LAYER = 0.96;

function reliefLogo(source: string): (offset: number) => string {
  let template = source
    .slice(source.indexOf("<svg"))
    .replace('role="img" aria-label="Xpdustry"', 'aria-hidden="true" focusable="false"')
    .replace(/\s*<title>.*?<\/title>/, "");
  for (const part of ["cog", "x"]) {
    template = template.replace(
      new RegExp(`(<g class="xp-w xp-w--${part}"[^>]*>).*?(</g>)`, "s"),
      `$1{{${part}}}$2`
    );
  }
  const steps = Array.from(
    { length: Math.round(DEPTH / LAYER) + Math.round(LIFT / LAYER) + 1 },
    (_, index) => (Math.round(DEPTH / LAYER) - index) * LAYER
  );

  return (offset) => {
    const layers = (part: string) =>
      steps
        .map(
          (t) =>
            `<use href="#xp-${part}" transform="translate(0 ${Math.max(t, offset).toFixed(2)})"/>`
        )
        .join("");
    return template
      .replace("{{cog}}", layers("cog"))
      .replace("{{x}}", layers("x"))
      .replaceAll(
        '<g class="xp-f ',
        `<g transform="translate(0 ${offset.toFixed(2)})" class="xp-f `
      );
  };
}

/** The sheet's RGBA pixels: `LOGO_FRAME_SHEET.count` frames, `LOGO_FRAME_SHEET.columns` to a row. */
export async function renderLogoFrames(source: string) {
  const { count, size, columns } = LOGO_FRAME_SHEET;
  const logoAt = reliefLogo(source);
  const frames = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      sharp(Buffer.from(logoAt(frameOffset(index))), { density: (72 * size) / 1072 })
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  const width = size * columns;
  const height = size * Math.ceil(count / columns);
  const pixels = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(frames.map((input, index) => ({ input, ...frameRect(index) })))
    .raw()
    .toBuffer();
  return { pixels, width, height };
}

/** Where the resting frame sits in the sheet, which `logo-relief.webp` is cut from. */
export const restingFrame = () => frameRect(frameIndex(0));
