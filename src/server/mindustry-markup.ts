/**
 * Mindustry colour markup.
 *
 * Server names and descriptions arrive wearing Mindustry's bracket markup:
 * `[red]danger[]`, `[#ff8800]orange[]`, `[[literal`. This module turns that
 * into tokens so the site can strip the formatting and render the text in its
 * own palette.
 *
 * Written from the observable behaviour of these three, not from their source:
 *
 * - https://github.com/xpdustry/distributor/blob/master/distributor-common/src/main/java/com/xpdustry/distributor/common/component/codec/MindustryDecoderImpl.java
 * - https://github.com/Anuken/Arc/blob/master/arc-core/src/arc/graphics/Colors.java
 * - https://github.com/Anuken/Mindustry/blob/e8bf80a1d2d5e9cf339c2fbc2a82444bf6d779d7/core/src/mindustry/core/UI.java#L101
 *
 * The rules that matter:
 *
 * - `[[` is an escaped `[`.
 * - `[]` closes the innermost open colour.
 * - `[name]` opens a colour when `name` is known, and is literal text otherwise.
 * - `[#rrggbb]` opens a colour for the hex lengths Mindustry accepts.
 * - An unterminated `[` is literal text to the end of the input.
 */

/**
 * Arc's registry, plus the five names Mindustry adds in `UI.loadColors()`.
 * Arc registers each name twice, uppercase with underscores and lowercase
 * without; matching is normalized instead, which accepts both spellings and
 * every casing between them.
 */
const NAMED_COLORS: Readonly<Record<string, string>> = {
  clear: "000000",
  black: "000000",
  white: "ffffff",
  lightgray: "bfbfbf",
  gray: "7f7f7f",
  darkgray: "3f3f3f",
  lightgrey: "bfbfbf",
  grey: "7f7f7f",
  darkgrey: "3f3f3f",

  // Arc overrides `blue` with royal for legibility in game.
  blue: "4169e1",
  navy: "000080",
  royal: "4169e1",
  slate: "708090",
  sky: "87ceeb",
  cyan: "00ffff",
  teal: "007f7f",

  green: "38d667",
  acid: "7fff00",
  lime: "32cd32",
  forest: "228b22",
  olive: "6b8e23",

  yellow: "ffff00",
  gold: "ffd700",
  goldenrod: "daa520",
  orange: "ffa500",

  brown: "8b4513",
  tan: "d2b48c",
  brick: "b22222",

  red: "e55454",
  scarlet: "ff341c",
  crimson: "dc143c",
  coral: "ff7f50",
  salmon: "fa8072",
  pink: "ff69b4",
  magenta: "ff00ff",

  purple: "a020f0",
  violet: "ee82ee",
  maroon: "b03060",

  // mindustry/core/UI.loadColors
  accent: "ffd37f",
  unlaunched: "8982ed",
  highlight: "ffe0a5",
  stat: "ffd37f",
  negstat: "e55454",
};

export type MarkupToken =
  | { type: "text"; value: string }
  | { type: "open"; color: string }
  | { type: "close" };

/**
 * Splits markup into text runs and colour boundaries. Colours nest, so a
 * consumer that cares about them keeps its own stack; `close` pops one level.
 */
export function tokenizeMindustryMarkup(input: string): MarkupToken[] {
  const tokens: MarkupToken[] = [];
  let pending = "";
  let index = 0;

  const flush = () => {
    if (pending !== "") {
      tokens.push({ type: "text", value: pending });
      pending = "";
    }
  };

  while (index < input.length) {
    const open = input.indexOf("[", index);
    if (open === -1) {
      pending += input.slice(index);
      break;
    }

    pending += input.slice(index, open);

    if (input[open + 1] === "[") {
      pending += "[";
      index = open + 2;
      continue;
    }

    const close = input.indexOf("]", open);
    if (close === -1) {
      // No terminator: the rest of the input, brackets included, is text.
      pending += input.slice(open);
      break;
    }

    const tag = input.slice(open + 1, close);
    index = close + 1;

    if (tag === "") {
      flush();
      tokens.push({ type: "close" });
      continue;
    }

    const color = resolveColor(tag);
    if (color === undefined) {
      // Unknown tags stay exactly as written; Mindustry draws them too.
      pending += input.slice(open, close + 1);
      continue;
    }

    flush();
    tokens.push({ type: "open", color });
  }

  flush();
  return tokens;
}

/** Drops every colour boundary and keeps the readable text. */
export function toPlainText(tokens: readonly MarkupToken[]): string {
  let out = "";
  for (const token of tokens) {
    if (token.type === "text") out += token.value;
  }
  return out;
}

/** Convenience for the common case: markup in, readable text out. */
export function stripMindustryMarkup(input: string): string {
  return toPlainText(tokenizeMindustryMarkup(input));
}

function resolveColor(tag: string): string | undefined {
  if (tag.startsWith("#")) return parseHexColor(tag.slice(1));
  const named = NAMED_COLORS[tag.toLowerCase().replaceAll("_", "")];
  return named;
}

/**
 * Mindustry accepts 1 to 6 hex digits (padded on the right) and 8 for RGBA,
 * but rejects 7 outright. Alpha is parsed and discarded: the site renders
 * these names in its own palette, never at the server's opacity.
 */
function parseHexColor(value: string): string | undefined {
  if (value.length === 0 || value.length === 7 || value.length > 8) return undefined;
  if (!/^[0-9a-fA-F]+$/.test(value)) return undefined;
  return value.slice(0, 6).padEnd(6, "0").toLowerCase();
}
