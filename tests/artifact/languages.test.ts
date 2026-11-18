import { expect, test } from "vitest";
import { HOSTILE_VISITOR, get, html } from "#tests/support/served.ts";

const titleOf = (page: string) => /<title>([^<]*)<\/title>/.exec(page)?.[1];

test("a language the site does not have is not a page", async () => {
  expect((await get("/de/blog")).status).toBe(404);
});

test.for(["/fr", "/ru/blog", "/fr/blog/nohorny-4-beta-8"])(
  "%s is in the language of its address, whatever the cookies say",
  async (path) => {
    const response = await get(path, HOSTILE_VISITOR);
    expect(response.status).toBe(200);
    const page = await response.text();
    expect(titleOf(page)).toBe(titleOf(await html(path)));
    expect(page).toContain(`<html lang="${path.slice(1, 3)}"`);
  }
);

test("a link followed within the site to an unprefixed page reads in English, and says so", async () => {
  const response = await get("/blog", {
    "accept-language": "fr-FR,fr;q=0.9",
    cookie: "generaltranslation.locale=fr",
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "navigate"
  });
  expect(response.status).toBe(200);
  expect(await response.text()).toContain('<html lang="en"');
  expect(response.headers.get("set-cookie")).toContain("generaltranslation.locale=en");
});

// Accept-Language weights: https://www.rfc-editor.org/rfc/rfc9110#section-12.4.2 (q=0 is "not
// acceptable") and https://www.rfc-editor.org/rfc/rfc9110#section-12.5.4.
test.for([
  ["/blog", { "accept-language": "fr-FR,fr;q=0.9" }, "/fr/blog"],
  ["/blog/nohorny-4-beta-8", { "accept-language": "ru" }, "/ru/blog/nohorny-4-beta-8"],
  ["/blog", { "accept-language": "fr;q=0.5, ru;q=0.9" }, "/ru/blog"],
  ["/blog", { "accept-language": "fr;q=0, ru" }, "/ru/blog"],
  ["/blog", { cookie: "generaltranslation.locale=ru" }, "/ru/blog"]
] as const)(
  "a first visit to %s is sent to its language, privately: %o",
  async ([path, visitor, destination]) => {
    const response = await get(path, visitor);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(destination);
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    expect(response.headers.get("vary")).toMatch(/accept-language.*cookie/i);
  }
);

test.for(["en-US", "fr;q=0"])(
  "a first visit that asks for %s stays in English, privately",
  async (languages) => {
    const response = await get("/", { "accept-language": languages });
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-cache");
    expect(response.headers.get("vary")).toMatch(/accept-language.*cookie/i);
  }
);

test.for([
  ["/", { "accept-language": "en-US,en;q=0.9,ru;q=0.8" }],
  ["/", { "accept-language": "en-US,ru;q=0.8" }],
  ["/blog", { "accept-language": "en-GB,en;q=0.9,fr;q=0.8" }],
  ["/", { "accept-language": "ru;q=0.5,en;q=0.9" }],
  ["/", { "accept-language": "ru-RU,ru;q=0.9", cookie: "generaltranslation.locale=en" }],
  ["/blog", { "accept-language": "fr-FR,fr;q=0.9", cookie: "generaltranslation.locale=en" }]
] as const)("a visit to %s that prefers English keeps it: %o", async ([path, visitor]) => {
  const response = await get(path, visitor);
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.headers.get("set-cookie")).toContain("generaltranslation.locale=en;");
  expect(await response.text()).toContain('<html lang="en"');
});
