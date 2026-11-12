# Languages

The site is served in English, French and Russian. A first visit follows the browser language, a visitor can switch from the header, and the choice sticks.

## Sub-features

- `lang-first-visit` sends a French or Russian browser from `/` to `/fr` or `/ru`, and leaves English at `/`.
- `lang-switch` changes language from the header button and lands on the same page under the new prefix.
- `lang-keep` keeps the prefix through in-page navigation.
- `lang-remember` returns a visitor who chose a language to it when they open `/` again.
- `lang-markup` sets `<html lang>` and lists every language in `hreflang` links.

## How to get to it (user POV)

- Open the site with a browser set to French or Russian.
- Choose the language button in the header (it shows `EN`, `FR` or `RU`), then a language from the list.
- Below 520px the button is gone: open `Menu` and pick the language at the bottom of the panel.
- Type a prefixed URL such as `/ru/blog`.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes.

```sh
$V run languages <<'EOF'
const russian = await get("/", { "accept-language": "ru-RU,ru;q=0.9" });
print("lang-first-visit ru:", russian.status, russian.headers.location); // 307 /ru
print("lang-first-visit en:", (await get("/", { "accept-language": "en-US" })).status); // 200

const page = await newPage({ width: 1280 });
await go(page, "/");
await page.getByRole("button", { name: "Language: English" }).click();
await snap(page, "1-list-open");
await page.getByRole("list", { name: "Language" }).getByRole("button", { name: "Français" }).click();
await page.waitForURL("**/fr");
await page.getByRole("link", { name: "Accueil" }).first().waitFor();
print("lang-switch:", page.url(), await page.locator("html").getAttribute("lang")); // …/fr fr
await snap(page, "2-french-home");

await page.getByRole("navigation").first().getByRole("link", { name: "Blog" }).click();
await page.waitForURL("**/fr/blog");
print("lang-keep:", page.url());

await go(page, "/");
const cookies = await page.context().cookies();
print("lang-remember:", page.url(), cookies.find((c) => c.name === "generaltranslation.locale")?.value); // …/fr fr
print("lang-markup:", await page.locator("link[rel=alternate][hreflang]").evaluateAll(
  (links) => links.map((link) => `${link.hreflang} ${link.href}`)));
EOF
```

Phone entry, where the switcher lives in the menu:

```sh
$V run languages-phone <<'EOF'
const page = await newPage({ width: 390, language: "ru" });
await go(page, "/");
await page.getByRole("heading", { level: 1 }).waitFor();
print("lang-first-visit:", page.url(), await page.locator("html").getAttribute("lang")); // …/ru ru
await page.getByRole("button", { name: "Меню" }).click();
const languages = page.getByRole("list", { name: "Язык" });
await languages.waitFor();
await snap(page, "1-menu-open");
await languages.getByRole("button", { name: "Français" }).click();
await page.waitForURL("**/fr");
await page.waitForFunction(() => document.documentElement.lang === "fr");
await page.getByRole("button", { name: "Menu" }).click();
const nav = page.getByRole("navigation", { name: "Navigation principale" });
print("lang-switch:", page.url(), await nav.getByRole("link").allInnerTexts()); // …/fr [Accueil, Projets, Modes, Blog, Maven]
await snap(page, "2-french-menu");
EOF
```

- **Fit.** Run `$V audit` afterwards; a language switch that works but wraps the navigation is not done.
- **Storage blocked.** A visitor whose browser drops cookies keeps the address's language after hydration. Make the context with `browser.newContext()`, add an init script that replaces `Document.prototype.cookie` with a getter returning `""` and a setter that does nothing, and makes `window.localStorage` throw. Then open `/fr`, `/ru` and `/fr/blog/nohorny-4-beta-11`, wait for the network to settle plus two seconds, and print `<html lang>`, `document.title` and the `h1`: they stay French or Russian. Follow a post link from `/fr/blog` too; it lands under `/fr`.

## Gotchas

- `get("/")` with no `accept-language` header is treated as English by the server.
- The first-visit redirect already sets the `generaltranslation.locale` cookie, before the visitor chooses anything.
- The switcher is labelled in the current language: `Langue : Français` on French pages, `Язык: Русский` on Russian ones.
- `/og/...` images ignore the visitor's language on purpose; only the URL prefix selects theirs. See [search metadata](search-metadata.md).
- A string missing from `src/_gt/<locale>.json` silently shows in English. Compare the keys with `src/_gt/en.json` when a page mixes languages.
