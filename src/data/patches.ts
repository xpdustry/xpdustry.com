// Every card's patches of labyrinth, in one place so `pnpm textures` can render their sprites.
// Radii are in px, sized for the card at its desktop height.

import { fringe, growing, patches, shaped, spreadTiles, type Blob } from "./textures.ts";

const LIGHT_TEAL = ["#86d8cf", "#a6e7e0"] as const;
const DEEP_TEAL = ["#104643", "#0c3c39"] as const;
const BLURPLE = ["#4652b5", "#4f5cc3"] as const;
const PLUM = ["#4d2238", "#3b1b2c"] as const;
const AMBER = ["#efcd95", "#f4dab0"] as const;
const BLUE = ["#b9c6fb", "#cad4fc"] as const;
const RED = ["#f7b0ae", "#f9c3c1"] as const;
const GREEN = ["#b4ecc4", "#c7f1d3"] as const;
const PURPLE = ["#d6c6f4", "#e1d5f7"] as const;

/**
 * The frayed edge of a gamemode's colour, where its header gives way to the card. Down the
 * header's side it is patches in the header's own tint, so only their outline shows, centred on
 * the line the colour would otherwise end at; they grow under the pointer, and each mode's are a
 * `shape` of their own. Where the header lies across the card, it is a fringe along its foot.
 */
const SIDE: Blob[] = [
  [0, 0.14, 44],
  [0, 0.86, 50, 3],
];
const edge = (tint: string, shape: number) => ({
  side: shaped(growing(patches(tint, tint, SIDE, 108), 1.25), shape),
  below: fringe(tint),
});

/**
 * Each gamemode's tint, as the frayed edges it ends in: the lighter tone of its palette, deep
 * enough to stand out from the card.
 */
export const EDGES = {
  survival: edge(AMBER[1], 1),
  pvp: edge(BLUE[1], 2),
  attack: edge(RED[1], 3),
  tower: edge(GREEN[1], 4),
  sandbox: edge(PURPLE[1], 5),
};

/** A project's card: patches of its own in its corners, clear of its text, growing under the pointer. */
const corners = (color: string, inner: string, blobs: Blob[]) =>
  growing(patches(color, inner, blobs));

/** A post's cover and the blog's lead card, in its topic's colours. */
const cover = (color: string, inner: string) =>
  growing(
    patches(color, inner, [
      [0.95, 0.1, 172],
      [0.78, 1.05, 90],
      [0.04, 1.1, 57],
    ]),
    1.2,
  );

export const PATCHES = {
  hero: patches(...LIGHT_TEAL, [
    [0.86, 0.82, 187],
    [0.56, 0.07, 49],
    [0.02, 1, 69],
  ]),
  play: patches("#f7d08c", "#fbdfab", [
    [0.97, 0.05, 81],
    [0.66, 1, 31],
  ]),
  discord: growing(
    patches(...BLURPLE, [
      [1, 0, 97],
      [0, 1, 62],
    ]),
  ),
  ...Object.fromEntries(Object.entries(EDGES).map(([mode, { side }]) => [`${mode}Side`, side])),
  nohornyCard: corners("#4d2238", "#3b1b2c", [
    [0.9, -0.08, 105],
    [1, 1, 70],
    [0, 0.6, 60],
  ]),
  clajCard: corners("#bf7b50", "#cc8b60", [
    [1, 1, 92],
    [0.96, -0.12, 52],
  ]),
  toxopidCard: corners("#6c80d2", "#7d90da", [
    [1, 0.02, 66],
    [0, 0.8, 50],
  ]),
  distributorCard: corners("#ccc15a", "#d9d06f", [
    [1, 0, 60],
    [0, 1, 56],
  ]),
  moreCard: corners("#104643", "#0c3c39", [
    [1, 1, 80],
    [0.55, -0.12, 56],
  ]),
  /** A post's card, in the corner under its title: faint, as the title sits on it. */
  tile: growing(
    patches("#c4e3df", "#d0e9e5", [
      [1, 1.02, 80],
      [0.62, 1.12, 24],
    ]),
  ),
  blogIntro: patches(...LIGHT_TEAL, [
    [0.92, 0.5, 77],
    [0.5, 1.08, 27],
  ]),
  ask: growing(patches(...BLURPLE, [[1, 0, 140]]), 1.25),
  askCompact: growing(patches(...BLURPLE, [[1, 0, 79]])),
  nohornyCover: cover(...PLUM),
  siteCover: cover(...DEEP_TEAL),
  message: patches(...LIGHT_TEAL, [
    [0.92, 0.5, 121],
    [0.5, 1.08, 43],
  ]),
};

/** Each gamemode's reticulate, as it spreads over the mode's header when its address is copied. */
export const SPREADS = {
  survival: spreadTiles(...AMBER),
  pvp: spreadTiles(...BLUE),
  attack: spreadTiles(...RED),
  tower: spreadTiles(...GREEN),
  sandbox: spreadTiles(...PURPLE),
};

/**
 * A rising fringe, used as a mask: a post's card, its texture and patches with it, rises over
 * its photo in this outline.
 */
const TILE_FRINGE = fringe("#f7fdfd", true);

/** Every fringe, for `pnpm textures` to render. */
export const FRINGES = [...Object.values(EDGES).map(({ below }) => below), TILE_FRINGE];
