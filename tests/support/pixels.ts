import { decode } from "fast-png";
import type { Locator, Page } from "playwright/test";
import { wcagContrast, type Rgb } from "./contrast.ts";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Shot {
  box: Box;
  at: (x: number, y: number) => Rgb;
}

export const padded = (box: Box, by: number, page: Page): Box => {
  const { width, height } = page.viewportSize()!;
  const x = Math.max(0, Math.floor(box.x - by));
  const y = Math.max(0, Math.floor(box.y - by));
  return {
    x,
    y,
    width: Math.max(1, Math.min(width, Math.ceil(box.x + box.width + by)) - x),
    height: Math.max(1, Math.min(height, Math.ceil(box.y + box.height + by)) - y)
  };
};

export async function shoot(page: Page, box: Box): Promise<Shot> {
  const png = decode(await page.screenshot({ clip: box, scale: "css", caret: "hide" }));
  const channels = png.data.length / (png.width * png.height);
  return {
    box,
    at: (x, y) => {
      const index = ((y - box.y) * png.width + (x - box.x)) * channels;
      return [png.data[index]!, png.data[index + 1]!, png.data[index + 2]!];
    }
  };
}

interface Ink {
  colour: [number, number, number, number];
  lines: Box[];
}

const HIDDEN_INK = "data-hidden-ink";

export async function worstTextContrast(text: Locator): Promise<number> {
  await text.scrollIntoViewIfNeeded();
  const ink = await text.evaluate((element, hidden): Ink => {
    let opacity = 1;
    for (let at: Element | null = element; at; at = at.parentElement) {
      opacity *= Number(getComputedStyle(at).opacity);
    }
    const [r, g, b, a = 1] = getComputedStyle(element)
      .color.match(/[\d.]+/g)!
      .map(Number) as [number, number, number, number?];
    const range = document.createRange();
    range.selectNodeContents(element);
    const lines = [...range.getClientRects()]
      .filter(({ width, height }) => width > 2 && height > 2)
      .map(({ x, y, width, height }) => ({ x, y, width, height }));
    element.setAttribute(hidden, "");
    return { colour: [r, g, b, a * opacity], lines };
  }, HIDDEN_INK);
  const page = text.page();
  const sheet = await page.addStyleTag({
    content: `[${HIDDEN_INK}], [${HIDDEN_INK}] * { -webkit-text-fill-color: transparent !important; text-shadow: none !important }`
  });
  let worst = Infinity;
  for (const line of ink.lines) {
    const box = padded(line, -1, page);
    const ground = await shoot(page, box);
    for (let y = box.y; y < box.y + box.height; y++) {
      for (let x = box.x; x < box.x + box.width; x++) {
        const under = ground.at(x, y);
        const [r, g, b, alpha] = ink.colour;
        const seen = [r, g, b].map((channel, i) => channel * alpha + under[i]! * (1 - alpha));
        worst = Math.min(worst, wcagContrast(seen, under));
      }
    }
  }
  await sheet.evaluate((element: Element) => element.remove());
  await text.evaluate((element, hidden) => element.removeAttribute(hidden), HIDDEN_INK);
  return worst;
}
