import {
  EndType,
  FillRule,
  JoinType,
  differenceD,
  inflatePathsD,
  intersectD,
  unionD,
  type PathD,
  type PathsD
} from "clipper2-ts";

/**
 * The shapes the pressable logo is drawn from, worked out from the logo's own numbers.
 *
 * The logo is a cog with an X dropped into a channel across it. The pressable one extrudes both,
 * and sweeps a shape down by stroking it: for that it wants each as one plain outline, where the
 * logo's SVG builds them from clips and cut-outs, and it wants the outline that goes round them
 * as a shape too, which is each of them grown. Both are polygon work, done here with Clipper.
 */
export const SHAPES = new URL("../src/landing/logo/shapes.ts", import.meta.url);

/**
 * The logo's geometry, in shares of its square: the defaults of `logo_renderer.py` in
 * xpdustry/.github, which draws the logo everywhere else. A change there is to be made here too.
 */
const LOGO = {
  outline: 0.02,
  cog: { radius: 0.3, hole: 0.24 },
  /** The four teeth on the axes: how far they reach, and how they narrow to a rounded tip. */
  axisTooth: { reach: 0.36, width: 0.12, taper: 0.02, tip: 0.01 },
  /** The four on the diagonals, which are the ends of two bars across the cog. */
  diagonalTooth: { reach: 0.33, width: 0.3, tip: 0.05 },
  x: { reach: 0.42, width: 0.12, tip: 0.02, gap: 0.02 }
} as const;

/** The logo's square, in the units its shapes are written in. */
const UNIT = 1024;
const CENTRE = UNIT / 2;

/**
 * How far sideways the shapes are stretched. Drawn squashed back, a round pen is left a vertical
 * sliver, so a stroke grows a shape up and down only: see `swept` in `PressableLogo.css`.
 */
const SQUASH = 0.02;

/**
 * How far a chord may stray from the curve it stands for, in units. The shapes are all chords: a
 * browser works a stroke out in the stretched units, where a curve is all but flat, and offsets
 * one as a few straight runs, which dents a swept outline.
 */
const TOLERANCE = 0.5;
/** Decimal places Clipper keeps. */
const PRECISION = 3;

const point = (x: number, y: number) => ({ x, y });

/** An arc about `(cx, cy)`, in degrees clockwise from the right, as chords within `TOLERANCE`. */
function arc(cx: number, cy: number, radius: number, from: number, to: number): PathD {
  const step = 2 * Math.acos(1 - TOLERANCE / radius);
  const sweep = ((to - from) * Math.PI) / 180;
  const chords = Math.max(1, Math.ceil(sweep / step));
  return Array.from({ length: chords + 1 }, (_, at) => {
    const angle = (from * Math.PI) / 180 + (sweep * at) / chords;
    return point(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  });
}

/** A disc about the centre, `radius` a share of the square. */
const disc = (radius: number): PathsD => [arc(CENTRE, CENTRE, radius * UNIT, 0, 360).slice(1)];

function turned(path: PathD, degrees: number): PathD {
  const angle = (degrees * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return path.map(({ x, y }) =>
    point(
      CENTRE + (x - CENTRE) * cos - (y - CENTRE) * sin,
      CENTRE + (x - CENTRE) * sin + (y - CENTRE) * cos
    )
  );
}

const all = (shapes: PathsD) => unionD(shapes, FillRule.NonZero);
const within = (shape: PathsD, limit: PathsD) =>
  intersectD(shape, limit, FillRule.NonZero, PRECISION);
const without = (shape: PathsD, cut: PathsD) =>
  differenceD(shape, cut, FillRule.NonZero, PRECISION);
const grown = (shape: PathsD, by: number) =>
  inflatePathsD(shape, by * UNIT, JoinType.Round, EndType.Polygon, 2, PRECISION, TOLERANCE);

/**
 * Two bars across the centre, on the diagonals, cut off round at `reach`: each `width` across,
 * its corners rounded by `tip`.
 */
function cross(reach: number, width: number, tip: number): PathsD {
  const [left, right] = [CENTRE - reach * UNIT, CENTRE + reach * UNIT];
  const [top, bottom] = [CENTRE - (width / 2) * UNIT, CENTRE + (width / 2) * UNIT];
  const r = tip * UNIT;
  const bar = [
    ...arc(right - r, top + r, r, -90, 0),
    ...arc(right - r, bottom - r, r, 0, 90),
    ...arc(left + r, bottom - r, r, 90, 180),
    ...arc(left + r, top + r, r, 180, 270)
  ];
  return within(all([turned(bar, 45), turned(bar, -45)]), disc(reach));
}

/** The teeth on the axes: one drawn to the right, narrowing to its rounded tip, and turned. */
function axisTeeth(): PathsD {
  const { reach, width, taper, tip } = LOGO.axisTooth;
  // A tooth leaves the cog's rim `width` across. Its sides are carried on back inside the cog, so
  // that rounding its corners leaves the pair on the rim alone.
  const rim = Math.sqrt(LOGO.cog.radius ** 2 - (width / 2) ** 2);
  const back = LOGO.cog.radius / 2;
  const slope = taper / 2 / (reach - rim);
  const [wide, narrow] = [width / 2 + slope * (rim - back), width / 2 - taper / 2];
  const tooth = [
    [back, -wide],
    [reach, -narrow],
    [reach, narrow],
    [back, wide]
  ].map(([x, y]) => point(CENTRE + x! * UNIT, CENTRE + y! * UNIT));
  const rounded = grown(grown([tooth], -tip), tip);
  const teeth = [0, 90, 180, 270].flatMap((angle) => rounded.map((path) => turned(path, angle)));
  return within(all(teeth), disc(reach));
}

/** The cog and the X as polygons, and each grown by the outline's width. */
function outlines() {
  const { cog, diagonalTooth, x, outline } = LOGO;
  const diagonals = cross(diagonalTooth.reach, diagonalTooth.width, diagonalTooth.tip);
  const solid = all([...disc(cog.radius), ...axisTeeth(), ...diagonals]);
  const channel = cross(x.reach + x.gap, x.width + 2 * x.gap, x.tip + x.gap);
  const bored = without(without(solid, disc(cog.hole)), channel);
  const bars = cross(x.reach, x.width, x.tip);
  return { cog: bored, cogInk: grown(bored, outline), x: bars, xInk: grown(bars, outline) };
}

const number = (value: number, places: number) => String(+value.toFixed(places));
/** A polygon as a path, stretched sideways. */
const path = (polygon: PathD) =>
  `M${polygon.map(({ x, y }) => `${number(x / SQUASH, 1)} ${number(y, 2)}`).join(" ")}Z`;
const paths = (polygons: PathsD) => polygons.map(path).join("");

/** How far below the centre a polygon lies, on average. */
const below = (polygon: PathD) =>
  polygon.reduce((sum, { y }) => sum + y - CENTRE, 0) / polygon.length;

/** The shapes, each as the path it is drawn with. */
export function logoShapes() {
  const { cog, cogInk, x, xInk } = outlines();
  // The channel for the X cuts the cog into four pieces: one above, two beside, one below.
  if (cog.length !== 4) throw new Error(`the cog is in ${cog.length} pieces, not four`);
  const third = (UNIT * LOGO.cog.hole) / 2;
  return {
    COG_NORTH: paths(cog.filter((piece) => below(piece) < -third)),
    COG_SIDES: paths(cog.filter((piece) => Math.abs(below(piece)) <= third)),
    COG_SOUTH: paths(cog.filter((piece) => below(piece) > third)),
    COG_INK: paths(cogInk),
    X: paths(x),
    X_INK: paths(xInk)
  };
}

const NOTES: Record<keyof ReturnType<typeof logoShapes>, string> = {
  COG_NORTH: "The cog, which the channel for the X cuts into four pieces: the one at the top.",
  COG_SIDES: "The cog's pieces left and right.",
  COG_SOUTH: "The cog's piece at the bottom.",
  COG_INK: "The whole cog grown by the outline's width, round at its corners.",
  X: "The X.",
  X_INK: "The X grown by the outline's width."
};

/** The module the pressable logo reads its shapes from. */
export function shapesModule(): string {
  const shapes = logoShapes();
  const names = Object.keys(shapes) as (keyof typeof shapes)[];
  return [
    `/**
 * The pressable logo's shapes, as plain paths in the logo's own ${UNIT}-unit square. Written by
 * \`pnpm textures\` from \`scripts/logo-shapes.ts\`, which says how they are made: not to be edited.
 * Each is stretched sideways, to be drawn under \`scale(SQUASH 1)\`.
 */
export const SQUASH = ${SQUASH};
`,
    ...names.map((name) => `/** ${NOTES[name]} */\nexport const ${name} =\n  "${shapes[name]}";\n`)
  ].join("\n");
}
