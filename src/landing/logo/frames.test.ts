import { describe, expect, test } from "vitest";
import { DEPTH, LIFT, LOGO_FRAME_SHEET, frameIndex, frameOffset, pressMotion } from "./frames";

describe("frameIndex", () => {
  test("finds each frame from its own press", () => {
    for (let index = 0; index < LOGO_FRAME_SHEET.count; index++) {
      expect(frameIndex(frameOffset(index))).toBe(index);
    }
  });

  test("stays within the sheet past either end", () => {
    expect(frameIndex(-LIFT * 2)).toBe(0);
    expect(frameIndex(DEPTH * 2)).toBe(LOGO_FRAME_SHEET.count - 1);
  });
});

describe("pressMotion", () => {
  test("rests without the pointer, rises under it and sinks quickly when held", () => {
    expect(pressMotion({ hover: false, held: false })).toEqual({ offset: 0, duration: 190 });
    expect(pressMotion({ hover: true, held: false })).toEqual({ offset: -LIFT, duration: 190 });
    expect(pressMotion({ hover: true, held: true })).toEqual({ offset: DEPTH, duration: 60 });
  });
});
