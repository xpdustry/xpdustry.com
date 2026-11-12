import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { TopicChip } from "./TopicChip";

describe("TopicChip", () => {
  test("links to the project's website only when asked and when there is one", () => {
    expect(renderToStaticMarkup(<TopicChip name="NoHorny" linked />)).toMatch(
      /^<a href="https:\/\/nohorny.xpdustry.com"/
    );
    expect(renderToStaticMarkup(<TopicChip name="NoHorny" />)).toMatch(/^<span /);
    expect(renderToStaticMarkup(<TopicChip name="Toxopid" linked />)).toMatch(/^<span /);
  });

  test("paints a card chip in its project's colours and leaves a cover chip to the cover", () => {
    expect(renderToStaticMarkup(<TopicChip name="NoHorny" />)).toContain("#f9a3c7");
    expect(renderToStaticMarkup(<TopicChip name="NoHorny" tone="cover" />)).toMatch(
      /^<span class="[^"]*">/
    );
  });

  test("shows the project's icon and the version beside the name", () => {
    const markup = renderToStaticMarkup(<TopicChip name="NoHorny" version="4" />);

    expect(markup).toContain('<img src="');
    expect(markup).toContain("NoHorny 4");
    expect(renderToStaticMarkup(<TopicChip name="Toxopid" />)).not.toContain("<img");
  });
});
