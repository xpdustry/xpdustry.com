import "./enter.css";

type TextureEntrance = "backdrop" | "drop" | "grow" | "grown";

export const texture = (entrance: TextureEntrance, tile?: number) => ({
  "data-texture": entrance,
  "data-tile": tile
});
