import { describe, expect, test } from "vitest";
import { isPlainClick } from "./LocaleSwitch";

const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };

describe("isPlainClick", () => {
  test("takes over a click of the main button", () => {
    expect(isPlainClick(click)).toBe(true);
  });

  test.each([
    ["the middle button", { button: 1 }],
    ["the secondary button", { button: 2 }],
    ["Cmd", { metaKey: true }],
    ["Ctrl", { ctrlKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }]
  ])("leaves a click with %s to the browser", (_label, change) => {
    expect(isPlainClick({ ...click, ...change })).toBe(false);
  });
});
