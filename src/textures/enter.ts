import "./enter.css";

type TextureEntrance = "backdrop" | "drop" | "face" | "grow" | "grown" | "rise";

export const texture = (entrance: TextureEntrance, tile?: number) => ({
  "data-texture": entrance,
  "data-tile": tile
});
