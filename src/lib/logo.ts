/** Depth of the logo's extrusion, and the extra rise on hover, in logo units. */
export const DEPTH = 30.72;
export const LIFT = 19.2;

/** The sheet: `count` frames, `size` px square, `columns` to a row, from raised to flat. */
export const LOGO_FRAME_SHEET = { count: 27, size: 320, columns: 9 } as const;
const STEP = (DEPTH + LIFT) / (LOGO_FRAME_SHEET.count - 1);

/** The press of each frame: -LIFT raised, 0 at rest, DEPTH flat. */
export const frameOffset = (index: number) => -LIFT + index * STEP;
/** The nearest frame to a press. */
export const frameIndex = (offset: number) =>
  Math.max(0, Math.min(LOGO_FRAME_SHEET.count - 1, Math.round((offset + LIFT) / STEP)));

/** Where frame `index` sits in the sheet. */
export function frameRect(index: number) {
  const { size, columns } = LOGO_FRAME_SHEET;
  return {
    left: (index % columns) * size,
    top: Math.floor(index / columns) * size,
    width: size,
    height: size
  };
}

/** Draws frame `index` of the decoded `sheet` over the whole canvas. */
export function drawFrame(
  context: CanvasRenderingContext2D,
  sheet: HTMLImageElement,
  index: number
) {
  const { left, top, width, height } = frameRect(index);
  const { canvas } = context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(sheet, left, top, width, height, 0, 0, canvas.width, canvas.height);
}
