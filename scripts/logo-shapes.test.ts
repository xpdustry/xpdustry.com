import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { assertLogoMatches } from "./logo-shapes.ts";

const logo = readFileSync(new URL("../src/brand/logo.svg", import.meta.url), "utf8");

test.each([
  ["a wider ring", 'cx="512" cy="512" r="307.2"', 'cx="512" cy="512" r="320"', "cog radius"],
  ["a wider X channel", 'height="163.84" rx="40.96"', 'height="204.8" rx="40.96"', "X gap width"]
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
