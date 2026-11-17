import { expect, test } from "vitest";
import { stripMindustryMarkup } from "./markup";

const shownInGame = (text: string) => stripMindustryMarkup(`a${text}b`);

test.each([
  "[LIGHT_GRAY]",
  "[lightgray]",
  "[DARK_GREY]",
  "[darkgrey]",
  "[RED]",
  "[red]",
  "[accent]",
  "[negstat]",
  "[#f]",
  "[#ff8800]",
  "[#FF880033]",
  "[]"
])("%s is a colour the game applies, so it is not shown", (tag) => {
  expect(shownInGame(tag)).toBe("ab");
});

test.each([
  "[LightGray]",
  "[light_gray]",
  "[lightGray]",
  "[LIGHTGRAY]",
  "[Red]",
  "[ACCENT]",
  "[Accent]",
  "[notacolour]",
  "[ red]",
  "[#]",
  "[#abcdefa]",
  "[#abcdefabc]",
  "[#gg0000]"
])("%s is no colour to the game, which shows it as written", (tag) => {
  expect(shownInGame(tag)).toBe(`a${tag}b`);
});

test.each([
  ["Grasslands Core", "Grasslands Core"],
  ["[accent]<CN>[] [white]Survival[]", "<CN> Survival"],
  ["[red]a[cyan]b[]c[]d", "abcd"],
  ["[gold]Привет 🌍 日本[]", "Привет 🌍 日本"],
  ["[red][]", ""]
])("%s reads %s once its colours are applied", (written, shown) => {
  expect(stripMindustryMarkup(written)).toBe(shown);
});

test.each([
  ["[[red]not a colour", "[red]not a colour"],
  ["[[[red]a colour after a bracket", "[a colour after a bracket"]
])("a doubled bracket in %s is one bracket of text", (written, shown) => {
  expect(stripMindustryMarkup(written)).toBe(shown);
});

test.each([
  ["wave [12", "wave [12"],
  ["ends with [", "ends with ["],
  ["[x[red]y", "[xy"],
  ["[#gg[red]y", "[#ggy"],
  ["[Red[]]", "[Red]"]
])(
  "a bracket that opens no colour in %s is text, and what follows it is still read",
  (written, shown) => {
    expect(stripMindustryMarkup(written)).toBe(shown);
  }
);
