import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import { decode } from "fast-png";
import { beforeAll, describe, expect, test } from "vitest";
import { SITE_THEME, topic } from "#app/blog/topics";
import { projects } from "#app/brand/projects";
import { CARD_SIZE } from "../../meta";
import { cardPalette, Texture, type CardTheme } from "./Card";

type Rgb = readonly number[];

function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

function rgb(hex: string): Rgb {
  return [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
}

/** Where the cards set type: the identifier, title and description column, then the stats row. */
const TYPE_AREAS = [
  { left: 80, top: 60, right: 840, bottom: 330 },
  { left: 80, top: 490, right: 800, bottom: 580 }
];

let renderer: Renderer;
beforeAll(() => {
  renderer = new Renderer();
});

/** The brightest pixel the textured ground shows under the type. */
async function brightestUnderType(ground: string): Promise<Rgb> {
  const { node, css } = await fromJsx(
    <div style={{ position: "relative", display: "flex", ...CARD_SIZE, background: ground }}>
      <Texture />
    </div>
  );
  const png = decode(await renderer.render(node, { ...CARD_SIZE, format: "png", css }));
  const pixel = (x: number, y: number): Rgb => {
    const at = y * png.width + x;
    if (png.palette) return png.palette[png.data[at]!]!.slice(0, 3);
    return [...png.data.subarray(at * png.channels, at * png.channels + 3)];
  };

  let brightest = rgb(ground);
  for (const area of TYPE_AREAS) {
    for (let y = area.top; y < area.bottom; y++) {
      for (let x = area.left; x < area.right; x++) {
        const candidate = pixel(x, y);
        if (luminance(candidate) > luminance(brightest)) brightest = candidate;
      }
    }
  }
  return brightest;
}

const themes: [string, CardTheme][] = [
  ["the site", SITE_THEME],
  ...projects
    .filter((project) => project.theme)
    .map((project): [string, CardTheme] => [project.name, topic(project.name)])
];

describe("cardPalette", () => {
  test.each(themes)("keeps %s's card text readable over the texture", async (_, theme) => {
    const palette = cardPalette(theme);
    const ground = await brightestUnderType(palette.ground);

    expect(contrast(rgb(palette.ink), ground)).toBeGreaterThanOrEqual(7);
    expect(contrast(rgb(palette.muted), ground)).toBeGreaterThanOrEqual(7);
    expect(contrast(rgb(palette.faint), ground)).toBeGreaterThanOrEqual(4.5);
  });

  test("refuses a colour it cannot mix", () => {
    expect(() => cardPalette({ ...SITE_THEME, accent: "#fff" })).toThrow("#rrggbb");
    expect(() => cardPalette({ ...SITE_THEME, muted: "rgba(0, 0, 0, 0.5)" })).toThrow("#rrggbb");
  });
});
