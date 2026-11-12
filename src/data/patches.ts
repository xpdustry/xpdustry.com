// Every card's patches of labyrinth, in one place so `pnpm textures` can render their sprites.
// Radii are in px, sized for the card at its desktop height.

import { growing, patches } from "./textures.ts";

const LIGHT_TEAL = ["#86d8cf", "#a6e7e0"] as const;
const DEEP_TEAL = ["#104643", "#0c3c39"] as const;
const BLURPLE = ["#4652b5", "#4f5cc3"] as const;
const PLUM = ["#4d2238", "#3b1b2c"] as const;

/** A gamemode's icon: one round patch behind its sprite. */
const icon = (color: string, inner: string, x = 0.333, y = 0.5, radius = 25) =>
  growing(patches(color, inner, [[x, y, radius]], 240));

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
  survival: icon("#efcd95", "#f4dab0"),
  pvpBlue: icon("#b9c6fb", "#cad4fc", 0.25, 0.57, 20),
  pvpRed: icon("#f7b0ae", "#f9c3c1", 0.43, 0.39, 23),
  attack: icon("#f7b0ae", "#f9c3c1"),
  tower: icon("#b4ecc4", "#c7f1d3"),
  sandbox: icon("#d6c6f4", "#e1d5f7"),
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
