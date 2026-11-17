const ARC_COLOURS_AS_DECLARED = [
  "CLEAR BLACK WHITE LIGHT_GRAY GRAY DARK_GRAY LIGHT_GREY GREY DARK_GREY",
  "BLUE NAVY ROYAL SLATE SKY CYAN TEAL",
  "GREEN ACID LIME FOREST OLIVE",
  "YELLOW GOLD GOLDENROD ORANGE",
  "BROWN TAN BRICK",
  "RED SCARLET CRIMSON CORAL SALMON PINK MAGENTA",
  "PURPLE VIOLET MAROON"
].flatMap((group) => group.split(" "));
const arcAlias = (declared: string) => declared.toLowerCase().replaceAll("_", "");
const MINDUSTRY_COLOURS = ["accent", "unlaunched", "highlight", "stat", "negstat"];

const NAMED_COLOURS: ReadonlySet<string> = new Set([
  ...ARC_COLOURS_AS_DECLARED,
  ...ARC_COLOURS_AS_DECLARED.map(arcAlias),
  ...MINDUSTRY_COLOURS
]);

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
    if (close !== -1 && isColourTag(input.slice(open + 1, close))) {
      index = close + 1;
    } else {
      out += "[";
      index = open + 1;
    }
  }

  return out;
}

function isColourTag(tag: string): boolean {
  if (tag === POP_TAG) return true;
  if (tag.startsWith("#")) return HEX_DIGITS_ARC_READS.test(tag.slice(1));
  return NAMED_COLOURS.has(tag);
}
