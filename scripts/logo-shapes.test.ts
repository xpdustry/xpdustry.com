import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { assertLogoMatches } from "./logo-shapes.ts";

const logo = readFileSync(new URL("../src/brand/logo.svg", import.meta.url), "utf8");

test("the logo as drawn in logo.svg is the one the shapes are cut from", () => {
  expect(() => assertLogoMatches(logo)).not.toThrow();
});

test.each([
  ["a smaller bore", 'r="245.76" fill="#000"', 'r="100" fill="#000"', "cog hole"],
  ["a wider ring", 'cx="512" cy="512" r="307.2"', 'cx="512" cy="512" r="320"', "cog radius"],
  ["a blunter axis tooth", "L 871.933 459.482", "L 871.933 452", "axis teeth taper"],
  ["a longer axis tooth", /880\.64/g, "890", "axis teeth length"],
  ["a wider X channel", 'height="163.84" rx="40.96"', 'height="204.8" rx="40.96"', "X gap width"],
  ["a rounder X channel", 'height="163.84" rx="40.96"', 'height="163.84" rx="61.44"', "X gap tip"],
  [
    "a shorter X bar",
    'x="81.92" y="450.56" width="860.16"',
    'x="100" y="450.56" width="824"',
    "X length"
  ]
])("a logo.svg with %s is refused", (_change, drawn, redrawn, named) => {
  const changed = logo.replaceAll(drawn, redrawn);
  expect(changed).not.toBe(logo);
  expect(() => assertLogoMatches(changed)).toThrow(named);
});

test("a logo.svg that lost a part is refused", () => {
  expect(() => assertLogoMatches(logo.replace('class="xp-cog-ring"', ""))).toThrow(
    "nothing matching"
  );
});
