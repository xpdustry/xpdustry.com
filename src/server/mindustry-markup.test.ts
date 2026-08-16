import { describe, expect, test } from "vitest";
import {
  stripMindustryMarkup,
  tokenizeMindustryMarkup,
  toPlainText,
} from "#app/server/mindustry-markup";

describe("tokenizeMindustryMarkup", () => {
  test("passes plain text through untouched", () => {
    expect(tokenizeMindustryMarkup("Survival server")).toEqual([
      { type: "text", value: "Survival server" },
    ]);
  });

  test("recognises a named colour and its closing tag", () => {
    expect(tokenizeMindustryMarkup("[red]danger[]")).toEqual([
      { type: "open", color: "e55454" },
      { type: "text", value: "danger" },
      { type: "close" },
    ]);
  });

  test("matches names case-insensitively and with or without underscores", () => {
    const expected = [
      { type: "open", color: "bfbfbf" },
      { type: "text", value: "x" },
    ];
    for (const tag of ["LIGHT_GRAY", "lightgray", "LightGray", "light_gray"]) {
      expect(tokenizeMindustryMarkup(`[${tag}]x`)).toEqual(expected);
    }
  });

  test("keeps Mindustry UI names the game servers actually use", () => {
    expect(tokenizeMindustryMarkup("[accent]a[negstat]b")).toEqual([
      { type: "open", color: "ffd37f" },
      { type: "text", value: "a" },
      { type: "open", color: "e55454" },
      { type: "text", value: "b" },
    ]);
  });

  test("nests colours and pops one level per close", () => {
    expect(tokenizeMindustryMarkup("[red]a[cyan]b[]c[]d")).toEqual([
      { type: "open", color: "e55454" },
      { type: "text", value: "a" },
      { type: "open", color: "00ffff" },
      { type: "text", value: "b" },
      { type: "close" },
      { type: "text", value: "c" },
      { type: "close" },
      { type: "text", value: "d" },
    ]);
  });

  test("accepts the hex lengths Mindustry accepts", () => {
    expect(tokenizeMindustryMarkup("[#ff8800]x")[0]).toEqual({
      type: "open",
      color: "ff8800",
    });
    // Short forms pad to the right.
    expect(tokenizeMindustryMarkup("[#f]x")[0]).toEqual({
      type: "open",
      color: "f00000",
    });
    // Eight digits are RGBA; alpha is parsed and dropped.
    expect(tokenizeMindustryMarkup("[#ff880033]x")[0]).toEqual({
      type: "open",
      color: "ff8800",
    });
  });

  test("leaves the hex lengths Mindustry rejects as literal text", () => {
    for (const tag of ["#abcdefa", "#abcdefabc", "#gg0000", "#"]) {
      expect(tokenizeMindustryMarkup(`[${tag}]x`)).toEqual([{ type: "text", value: `[${tag}]x` }]);
    }
  });

  test("turns a doubled bracket into one literal bracket", () => {
    expect(tokenizeMindustryMarkup("[[red]not a colour")).toEqual([
      { type: "text", value: "[red]not a colour" },
    ]);
  });

  test("leaves an unknown tag as literal text", () => {
    expect(tokenizeMindustryMarkup("[notacolour]x")).toEqual([
      { type: "text", value: "[notacolour]x" },
    ]);
  });

  test("leaves an unterminated bracket as literal text", () => {
    expect(tokenizeMindustryMarkup("wave [12")).toEqual([{ type: "text", value: "wave [12" }]);
  });

  test("preserves non-ASCII text and emoji", () => {
    expect(toPlainText(tokenizeMindustryMarkup("[gold]Привет 🌍 日本[]"))).toBe("Привет 🌍 日本");
  });
});

describe("stripMindustryMarkup", () => {
  test("removes formatting and keeps readable content", () => {
    expect(stripMindustryMarkup("[accent]<CN>[] [white]Survival[]")).toBe("<CN> Survival");
  });

  test("is a no-op on text with nothing to strip", () => {
    expect(stripMindustryMarkup("Grasslands Core")).toBe("Grasslands Core");
  });

  test("returns an empty string for markup with no text", () => {
    expect(stripMindustryMarkup("[red][]")).toBe("");
  });
});
