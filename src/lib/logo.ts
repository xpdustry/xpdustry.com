// The relief logo at any press, built from the stock logo's SVG. `pnpm textures` renders its frames
// for `PressableLogo`, and its resting frame alone: browsers take up to a quarter of a second to
// rasterise each (Firefox), against ~20 ms (Chromium), and repaint it with whatever holds it.

/** Depth of the logo's extrusion, and the extra rise on hover, in logo units. */
export const DEPTH = 30.72;
export const LIFT = 19.2;
const LAYER = 0.96;

/** The sheet: `count` frames, `size` px square, `columns` to a row, from raised to flat. */
export const FRAMES = { count: 27, size: 320, columns: 9 } as const;
const STEP = (DEPTH + LIFT) / (FRAMES.count - 1);

/** The press of each frame: -LIFT raised, 0 at rest, DEPTH flat. */
export const frameOffset = (index: number) => -LIFT + index * STEP;
/** The nearest frame to a press. */
export const frameIndex = (offset: number) =>
  Math.max(0, Math.min(FRAMES.count - 1, Math.round((offset + LIFT) / STEP)));

/**
 * The relief logo from the stock logo's `source`, as a function of how far its face is pressed
 * below its resting place, in logo units: -LIFT raised, DEPTH flat.
 */
export function reliefLogo(source: string): (offset: number) => string {
  // the stock extrusion, rebuilt deeper: one layer per LAYER from the pressed depth up to the
  // hover lift, so the face can move anywhere in that range with the walls folding in under it
  let template = source
    .slice(source.indexOf("<svg"))
    .replace('role="img" aria-label="Xpdustry"', 'aria-hidden="true" focusable="false"')
    .replace(/\s*<title>.*?<\/title>/, "");
  for (const part of ["cog", "x"]) {
    template = template.replace(
      new RegExp(`(<g class="xp-w xp-w--${part}"[^>]*>).*?(</g>)`, "s"),
      `$1{{${part}}}$2`,
    );
  }
  const steps = Array.from(
    { length: Math.round(DEPTH / LAYER) + Math.round(LIFT / LAYER) + 1 },
    (_, index) => (Math.round(DEPTH / LAYER) - index) * LAYER,
  );

  return (offset) => {
    const layers = (part: string) =>
      steps
        .map(
          (t) =>
            `<use href="#xp-${part}" transform="translate(0 ${Math.max(t, offset).toFixed(2)})"/>`,
        )
        .join("");
    return template
      .replace("{{cog}}", layers("cog"))
      .replace("{{x}}", layers("x"))
      .replaceAll(
        '<g class="xp-f ',
        `<g transform="translate(0 ${offset.toFixed(2)})" class="xp-f `,
      );
  };
}

/** Draws frame `index` of the decoded `sheet` over the whole canvas. */
export function drawFrame(
  context: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  index: number,
) {
  const { size, columns } = FRAMES;
  const { width, height } = context.canvas;
  context.clearRect(0, 0, width, height);
  context.drawImage(
    sheet,
    (index % columns) * size,
    Math.floor(index / columns) * size,
    size,
    size,
    0,
    0,
    width,
    height,
  );
}
