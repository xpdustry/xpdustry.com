import { expect, test } from "vitest";
import { stripMindustryMarkup } from "./markup";

test.each([
  ["Grasslands Core", "Grasslands Core"],
  ["[accent]<CN>[] [white]Survival[]", "<CN> Survival"],
  ["[red]a[cyan]b[]c[]d", "abcd"],
  ["[LIGHT_GRAY]a[lightgray]b[LightGray]c[light_gray]d", "abcd"],
  ["[#f]a[#ff8800]b[#ff880033]c", "abc"],
  ["[#abcdefa]a[#abcdefabc]b[#gg0000]c[#]d", "[#abcdefa]a[#abcdefabc]b[#gg0000]c[#]d"],
  ["[[red]not a colour", "[red]not a colour"],
  ["[notacolour]x", "[notacolour]x"],
  ["wave [12", "wave [12"],
  ["[gold]Привет 🌍 日本[]", "Привет 🌍 日本"],
  ["[red][]", ""]
])("strips formatting without losing literal text: %s", (input, expected) => {
  expect(stripMindustryMarkup(input)).toBe(expected);
});
