const ARC_COLOURS = [
  "clear black white lightgray gray darkgray lightgrey grey darkgrey",
  "blue navy royal slate sky cyan teal",
  "green acid lime forest olive",
  "yellow gold goldenrod orange",
  "brown tan brick",
  "red scarlet crimson coral salmon pink magenta",
  "purple violet maroon"
];
const MINDUSTRY_COLOURS = ["accent unlaunched highlight stat negstat"];

const NAMED_COLOURS: ReadonlySet<string> = new Set(
  [...ARC_COLOURS, ...MINDUSTRY_COLOURS].flatMap((group) => group.split(" "))
);

const POP_TAG = "";
const HEX_DIGITS_ARC_READS = /^(?:[0-9a-f]{1,6}|[0-9a-f]{8})$/i;

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
    if (!isColourTag(tag)) out += input.slice(open, close + 1);
    index = close + 1;
  }

  return out;
}

function isColourTag(tag: string): boolean {
  if (tag === POP_TAG) return true;
  if (tag.startsWith("#")) return HEX_DIGITS_ARC_READS.test(tag.slice(1));
  return NAMED_COLOURS.has(tag.toLowerCase().replaceAll("_", ""));
}
