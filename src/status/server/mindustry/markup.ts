// Mindustry's colour markup: `[name]`, `[#rrggbb]` or `[]` around text, `[[` for a literal `[`.

// Arc's colour names, and Mindustry's additions, normalized to lowercase without underscores.
const NAMED_COLORS: ReadonlySet<string> = new Set(
  [
    "clear black white lightgray gray darkgray lightgrey grey darkgrey",
    "blue navy royal slate sky cyan teal",
    "green acid lime forest olive",
    "yellow gold goldenrod orange",
    "brown tan brick",
    "red scarlet crimson coral salmon pink magenta",
    "purple violet maroon",
    "accent unlaunched highlight stat negstat"
  ].flatMap((group) => group.split(" "))
);

/** The text without its colour tags. Does not make it safe for HTML. */
export function stripMindustryMarkup(input: string): string {
  let out = "";
  let index = 0;

  while (index < input.length) {
    const open = input.indexOf("[", index);
    if (open === -1) return out + input.slice(index);
    out += input.slice(index, open);

    if (input[open + 1] === "[") {
      out += "[";
      index = open + 2;
      continue;
    }

    const close = input.indexOf("]", open);
    if (close === -1) return out + input.slice(open);

    const tag = input.slice(open + 1, close);
    if (tag !== "" && !isColor(tag)) out += input.slice(open, close + 1);
    index = close + 1;
  }

  return out;
}

function isColor(tag: string): boolean {
  if (tag.startsWith("#")) return isHexColor(tag.slice(1));
  return NAMED_COLORS.has(tag.toLowerCase().replaceAll("_", ""));
}

// Mindustry accepts 1 to 6 or 8 hex digits and right-pads short forms; alpha is discarded.
function isHexColor(value: string): boolean {
  return value.length > 0 && value.length !== 7 && value.length <= 8 && /^[0-9a-f]+$/i.test(value);
}
