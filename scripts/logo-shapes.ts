import { readFileSync } from "node:fs";
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

export const SHAPES = new URL("../src/landing/logo/shapes.ts", import.meta.url);
const LOGO_SVG = new URL("../src/brand/logo.svg", import.meta.url);

type ShareOfSquare = number;
type Units = number;
type Degrees = number;

const LOGO = {
  outline: 0.02,
  cog: { radius: 0.3, hole: 0.24 },
  axisTooth: { reach: 0.36, width: 0.12, taper: 0.02, tip: 0.01 },
  diagonalTooth: { reach: 0.33, width: 0.3, tip: 0.05 },
  x: { reach: 0.42, width: 0.12, tip: 0.02, gap: 0.02 }
} as const satisfies Record<string, ShareOfSquare | Record<string, ShareOfSquare>>;

const SQUARE: Units = 1024;
const CENTRE: Units = SQUARE / 2;

const SQUASH = 0.02;

const CHORD_TOLERANCE: Units = 0.5;
const CLIPPER_DECIMALS = 3;

const point = (x: Units, y: Units) => ({ x, y });
const units = (share: ShareOfSquare): Units => share * SQUARE;
const radians = (degrees: Degrees) => (degrees * Math.PI) / 180;

function arc(cx: Units, cy: Units, radius: Units, from: Degrees, to: Degrees): PathD {
  const step = 2 * Math.acos(1 - CHORD_TOLERANCE / radius);
  const sweep = radians(to - from);
  const chords = Math.max(1, Math.ceil(sweep / step));
  return Array.from({ length: chords + 1 }, (_, at) => {
    const angle = radians(from) + (sweep * at) / chords;
    return point(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  });
}

const centredDisc = (radius: ShareOfSquare): PathsD => [
  arc(CENTRE, CENTRE, units(radius), 0, 360).slice(1)
];

function turnedAboutCentre(path: PathD, degrees: Degrees): PathD {
  const angle = radians(degrees);
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
  intersectD(shape, limit, FillRule.NonZero, CLIPPER_DECIMALS);
const without = (shape: PathsD, cut: PathsD) =>
  differenceD(shape, cut, FillRule.NonZero, CLIPPER_DECIMALS);
const grown = (shape: PathsD, by: ShareOfSquare) =>
  inflatePathsD(
    shape,
    units(by),
    JoinType.Round,
    EndType.Polygon,
    2,
    CLIPPER_DECIMALS,
    CHORD_TOLERANCE
  );

function diagonalBars(reach: ShareOfSquare, width: ShareOfSquare, tip: ShareOfSquare): PathsD {
  const [left, right] = [CENTRE - units(reach), CENTRE + units(reach)];
  const [top, bottom] = [CENTRE - units(width / 2), CENTRE + units(width / 2)];
  const r = units(tip);
  const bar = [
    ...arc(right - r, top + r, r, -90, 0),
    ...arc(right - r, bottom - r, r, 0, 90),
    ...arc(left + r, bottom - r, r, 90, 180),
    ...arc(left + r, top + r, r, 180, 270)
  ];
  return within(all([turnedAboutCentre(bar, 45), turnedAboutCentre(bar, -45)]), centredDisc(reach));
}

const axisToothRim = (): ShareOfSquare =>
  Math.sqrt(LOGO.cog.radius ** 2 - (LOGO.axisTooth.width / 2) ** 2);

function axisTeeth(): PathsD {
  const { reach, width, taper, tip } = LOGO.axisTooth;
  const rim = axisToothRim();
  const buriedInCog = LOGO.cog.radius / 2;
  const slope = taper / 2 / (reach - rim);
  const [wide, narrow] = [width / 2 + slope * (rim - buriedInCog), width / 2 - taper / 2];
  const tooth = [
    [buriedInCog, -wide],
    [reach, -narrow],
    [reach, narrow],
    [buriedInCog, wide]
  ].map(([x, y]) => point(CENTRE + units(x!), CENTRE + units(y!)));
  const rounded = grown(grown([tooth], -tip), tip);
  const teeth = [0, 90, 180, 270].flatMap((angle) =>
    rounded.map((path) => turnedAboutCentre(path, angle))
  );
  return within(all(teeth), centredDisc(reach));
}

function outlines() {
  const { cog, diagonalTooth, x, outline } = LOGO;
  const diagonals = diagonalBars(diagonalTooth.reach, diagonalTooth.width, diagonalTooth.tip);
  const solid = all([...centredDisc(cog.radius), ...axisTeeth(), ...diagonals]);
  const channel = diagonalBars(x.reach + x.gap, x.width + 2 * x.gap, x.tip + x.gap);
  const bored = without(without(solid, centredDisc(cog.hole)), channel);
  const bars = diagonalBars(x.reach, x.width, x.tip);
  return { cog: bored, cogInk: grown(bored, outline), x: bars, xInk: grown(bars, outline) };
}

const SVG_TOLERANCE: ShareOfSquare = 1e-5;

function toothInSvg(svg: string, drawn: (pattern: string) => string) {
  const [rootX, rootTop, shoulderX, shoulderY, tip, , , , , endX] = [
    ...drawn(`id="xp-tooth" d="([^"]+)"`).matchAll(/-?[\d.]+/g)
  ].map(Number);
  const rootBottom = Number(drawn(`id="xp-tooth" d="[^"]* ([\\d.]+) Z"`));
  const [root, reach] = [(rootX! - CENTRE) / SQUARE, (endX! - CENTRE) / SQUARE];
  return {
    root,
    reach,
    width: (rootBottom - rootTop!) / SQUARE,
    tip: tip! / SQUARE,
    taper: ((2 * (shoulderY! - rootTop!)) / (shoulderX! - rootX!)) * (reach - root)
  };
}

export function assertLogoMatches(svg: string) {
  const drawn = (pattern: string) => {
    const found = new RegExp(pattern).exec(svg)?.[1];
    if (found === undefined) throw new Error(`logo.svg has nothing matching ${pattern}`);
    return found;
  };
  const share = (pattern: string) => Number(drawn(pattern)) / SQUARE;
  const bar = (id: string) => ({
    reach: 0.5 - share(`id="${id}"[^>]* x="([\\d.]+)"`),
    width: share(`id="${id}"[^>]* height="([\\d.]+)"`),
    tip: share(`id="${id}"[^>]* rx="([\\d.]+)"`)
  });
  const clip = (id: string) => share(`id="${id}"><circle [^>]* r="([\\d.]+)"`);
  const tooth = toothInSvg(svg, drawn);
  const { x, diagonalTooth, axisTooth, cog } = LOGO;
  const pairs: [string, ShareOfSquare, ShareOfSquare][] = [
    ["cog radius", share(`class="xp-cog-ring" [^>]* r="([\\d.]+)"`), cog.radius],
    ["cog hole", share(`id="xp-bore"[^]*?<circle [^>]* r="([\\d.]+)"`), cog.hole],
    ["axis teeth reach", clip("xp-clip-axis"), axisTooth.reach],
    ["axis teeth length", tooth.reach, axisTooth.reach],
    ["axis teeth root", tooth.root, axisToothRim()],
    ["axis teeth width", tooth.width, axisTooth.width],
    ["axis teeth taper", tooth.taper, axisTooth.taper],
    ["axis teeth tip", tooth.tip, axisTooth.tip],
    ["diagonal teeth reach", clip("xp-clip-diagonal"), diagonalTooth.reach],
    ["diagonal teeth length", bar("xp-diagonal-bar").reach, diagonalTooth.reach],
    ["diagonal teeth width", bar("xp-diagonal-bar").width, diagonalTooth.width],
    ["diagonal teeth tip", bar("xp-diagonal-bar").tip, diagonalTooth.tip],
    ["X reach", clip("xp-clip-x"), x.reach],
    ["X length", bar("xp-x-bar").reach, x.reach],
    ["X width", bar("xp-x-bar").width, x.width],
    ["X tip", bar("xp-x-bar").tip, x.tip],
    ["X gap reach", clip("xp-clip-gap"), x.reach + x.gap],
    ["X gap length", bar("xp-gap-bar").reach, x.reach + x.gap],
    ["X gap width", bar("xp-gap-bar").width, x.width + 2 * x.gap],
    ["X gap tip", bar("xp-gap-bar").tip, x.tip + x.gap]
  ];
  for (const [what, inSvg, here] of pairs) {
    if (!(Math.abs(inSvg - here) <= SVG_TOLERANCE)) {
      throw new Error(`the logo's ${what} is ${inSvg} in logo.svg but ${here} here`);
    }
  }
}

const number = (value: number, places: number) => String(+value.toFixed(places));
const stretchedPath = (polygon: PathD) =>
  `M${polygon.map(({ x, y }) => `${number(x / SQUASH, 1)} ${number(y, 2)}`).join(" ")}Z`;
const paths = (polygons: PathsD) => polygons.map(stretchedPath).join("");

const averageDepthBelowCentre = (polygon: PathD): Units =>
  polygon.reduce((sum, { y }) => sum + y - CENTRE, 0) / polygon.length;

export function logoShapes() {
  assertLogoMatches(readFileSync(LOGO_SVG, "utf8"));
  const { cog, cogInk, x, xInk } = outlines();
  if (cog.length !== 4) throw new Error(`the X cuts the cog into ${cog.length} pieces, not four`);
  const sideBand = units(LOGO.cog.hole) / 2;
  return {
    COG_NORTH: paths(cog.filter((piece) => averageDepthBelowCentre(piece) < -sideBand)),
    COG_SIDES: paths(cog.filter((piece) => Math.abs(averageDepthBelowCentre(piece)) <= sideBand)),
    COG_SOUTH: paths(cog.filter((piece) => averageDepthBelowCentre(piece) > sideBand)),
    COG_INK: paths(cogInk),
    X: paths(x),
    X_INK: paths(xInk)
  };
}

export function shapesModule(): string {
  const shapes = logoShapes();
  const names = Object.keys(shapes) as (keyof typeof shapes)[];
  return [
    `// @generated by \`pnpm textures\` from scripts/logo-shapes.ts\n\nexport const SQUASH = ${SQUASH};\n`,
    ...names.map((name) => `export const ${name} =\n  "${shapes[name]}";\n`)
  ].join("\n");
}
