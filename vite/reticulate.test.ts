import { describe, expect, test } from "vitest";
import { type Field, blurMask, runPhase, seedField, toMask } from "./reticulate.ts";

/** The committed asset runs 14000 steps; these run tens, on a tiny grid. */
function stub(size = 16): { field: Field; random: () => number } {
  let state = 7;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  return { field: seedField(size, random), random };
}

describe("runPhase", () => {
  test("keeps both morphogens inside their bounds", () => {
    const { field, random } = stub();

    const out = runPhase(field, { ratio: 30, scale: 3, speed: 40, steps: 200, floorB: 2 }, random);

    expect(out.a.every((value) => value >= 0 && value <= 1000)).toBe(true);
    expect(out.b.every((value) => value >= 2 && value <= 1000)).toBe(true);
    expect(out.b.some((value) => value !== out.b[0])).toBe(true);
  });

  test("grows the field by one row and column per growth step", () => {
    const { field, random } = stub();

    const out = runPhase(
      field,
      { ratio: 8, scale: 3, speed: 40, steps: 20, floorB: 2, growEvery: 10 },
      random,
    );

    // Growth fires on steps 1 and 11, so 16 becomes 18 on both axes.
    expect([out.width, out.height]).toEqual([18, 18]);
    expect(out.a.length).toBe(18 * 18);
  });

  test("is deterministic for a given seed", () => {
    const options = { ratio: 8, scale: 3, speed: 40, steps: 30, floorB: 2, growEvery: 10 };
    const first = stub();
    const second = stub();

    const a = runPhase(first.field, options, first.random);
    const b = runPhase(second.field, options, second.random);

    expect(Array.from(a.b)).toEqual(Array.from(b.b));
  });
});

describe("toMask", () => {
  test("covers the low end of the field and clears the rest", () => {
    const field: Field = {
      a: new Float64Array(4),
      b: Float64Array.from([2, 4, 6, 8]),
      width: 2,
      height: 2,
    };

    const mask = toMask(field);

    // The ramp is teal only near the minimum, so only the first cell is ink.
    expect(mask[0]).toBe(255);
    expect(mask[3]).toBe(0);
    expect(mask[1]).toBeLessThan(mask[0]);
  });
});

describe("blurMask", () => {
  test("spreads a lone pixel into its wrapped neighbours", () => {
    const mask = new Uint8Array(16);
    mask[0] = 255;

    const blurred = blurMask(mask, 4, 4, 1);

    expect(blurred[0]).toBeLessThan(255);
    expect(blurred[0]).toBeGreaterThan(0);
    // Index 3 is the far end of the first row, a neighbour only by wrapping.
    expect(blurred[3]).toBeGreaterThan(0);
    expect(blurred[5]).toBeGreaterThan(0);
  });

  test("leaves a flat mask alone", () => {
    const mask = new Uint8Array(36).fill(120);

    expect(Array.from(blurMask(mask, 6, 6, 2))).toEqual(Array.from(mask));
  });
});
