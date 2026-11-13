import { expect, test } from "vitest";
import { outbound } from "./outbound";

test.each([
  "https://github.com/someone-else/project",
  "https://github.com/xpdustry-fans",
  "http://example.com",
  "https://xpdustry.com.evil.example",
  "https://github.com/phinner-fans",
  "https://evil.example/github.com/xpdustry",
  "https://notzetamap.fr"
])("%s opens in a new tab without a referrer", (href) => {
  expect(outbound(href)).toEqual({ target: "_blank", rel: "noreferrer" });
});

test.each([
  "https://nohorny.xpdustry.com",
  "https://maven.xpdustry.com/releases",
  "https://xpdustry.com",
  "https://github.com/xpdustry",
  "https://github.com/xpdustry/nohorny/releases/tag/v4.0.0",
  "https://GitHub.com/ZetaMap",
  "https://github.com/phinner?tab=repositories",
  "https://zetamap.fr/",
  "https://phinner.dev"
])("%s is ours: it opens in a new tab and learns where the visitor came from", (href) => {
  expect(outbound(href)).toEqual({ target: "_blank", rel: "noopener" });
});

test.each(["/blog", "#top", "mailto:contact@xpdustry.com", undefined])(
  "%s stays in the tab",
  (href) => {
    expect(outbound(href)).toEqual({});
  }
);
