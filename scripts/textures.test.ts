import { expect, test } from "vitest";
import * as shapes from "../src/landing/logo/shapes.ts";
import { readLabyrinthPixels, readPattern } from "./labyrinth.ts";
import { logoShapes } from "./logo-shapes.ts";

test("the labyrinth the browser gets is the pattern, give or take its encoding", async () => {
  const pattern = await readPattern();
  const labyrinth = await readLabyrinthPixels();
  expect(labyrinth.size, "labyrinth.avif is out of date").toBe(pattern.size);
  let squares = 0;
  for (let at = 0; at < pattern.data.length; at++) {
    squares += (pattern.data[at]! - labyrinth.data[at]!) ** 2;
  }
  // Another encoder build may differ by a value here and there; another pattern is far off.
  const error = Math.sqrt(squares / pattern.data.length);
  expect(error, "labyrinth.avif is out of date").toBeLessThan(4);
});

test("the pressable logo's shapes are the logo's", () => {
  expect(shapes, "shapes.ts is out of date: run pnpm textures").toMatchObject(logoShapes());
});
