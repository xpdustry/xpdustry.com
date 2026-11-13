import "./enter.css";

/**
 * How a texture comes in on the first screen, played by the shell's inline `ENTER` script.
 *
 * - `backdrop`: the page's two reticulate layers, its `::before` then its `::after`, fade in.
 * - `drop`: the crown settles down onto the header.
 * - `grow`: a patch's blob grows from its middle as the labyrinth does, threads first, at the
 *   scale of its labyrinth's `tile`, in px. `grown` is the larger sprite over it, which opens to
 *   its resting size with it.
 *
 * Unmarked textures paint with the page: those that shape it, like a band's frayed edge or the
 * footer's ridge, which would otherwise show cut straight while they wait.
 */
type TextureKind = "backdrop" | "drop" | "grow" | "grown";

/** The marker a texture carries, for its kind. */
export const texture = (kind: TextureKind, tile?: number) => ({
  "data-texture": kind,
  "data-tile": tile
});
