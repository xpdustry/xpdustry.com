import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import { decode } from "fast-png";
import { beforeAll, describe, expect, test } from "vitest";
import { SITE_THEME, topic } from "#app/blog/topics";
import { projects } from "#app/brand/projects";
import { rgb, wcagContrast, wcagLuminance, type Rgb } from "#tests/support/contrast";
import { CARD_SIZE } from "../../meta";
import { cardPalette, Texture, type CardTheme } from "./Card";

const AREAS_UNDER_TYPE = {
  identifierTitleAndDescription: { left: 80, top: 60, right: 840, bottom: 330 },
  stats: { left: 80, top: 490, right: 800, bottom: 580 }
};

const WCAG_AAA = 7;
const WCAG_AA = 4.5;

let renderer: Renderer;
beforeAll(() => {
  renderer = new Renderer();
});

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
  for (const area of Object.values(AREAS_UNDER_TYPE)) {
    for (let y = area.top; y < area.bottom; y++) {
      for (let x = area.left; x < area.right; x++) {
        const candidate = pixel(x, y);
        if (wcagLuminance(candidate) > wcagLuminance(brightest)) brightest = candidate;
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

    expect(wcagContrast(rgb(palette.ink), ground)).toBeGreaterThanOrEqual(WCAG_AAA);
    expect(wcagContrast(rgb(palette.muted), ground)).toBeGreaterThanOrEqual(WCAG_AAA);
    expect(wcagContrast(rgb(palette.faint), ground)).toBeGreaterThanOrEqual(WCAG_AA);
  });

  test.each([{ accent: "#fff" }, { muted: "rgba(0, 0, 0, 0.5)" }])(
    "refuses a colour it cannot mix: %j",
    (colour) => {
      expect(() => cardPalette({ ...SITE_THEME, ...colour })).toThrow("#rrggbb");
    }
  );
});
