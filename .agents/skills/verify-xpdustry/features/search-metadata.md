# Search and social metadata

What search engines and link previews read: the title and description, the canonical and alternate-language links, structured data, the sitemap, and the card image drawn for each page in each language.

## Sub-features

- `meta-head` gives each page a title, description and canonical URL in its language.
- `meta-alternates` links every language version and `x-default`.
- `meta-structured` embeds `WebSite` and `Organization` on the home page, `BlogPosting` and `BreadcrumbList` on posts.
- `meta-sitemap` lists every page in every language, and `robots.txt` points at it.
- `meta-cards` serves a 1200×630 PNG per page and language, and 404 for unknown ones.

## How to get to it (user POV)

- Paste a page link into Discord or another app that previews links.
- Find the site through a search engine, in any of the three languages.
- Open `/sitemap.xml`, `/robots.txt` or `/og/home.png` directly.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes.

Start with `$V seo`: it checks all of the sub-features below on every sitemap page and compares them with the committed baseline. The script that follows is for looking at specific pages and for saving the cards, which `seo` only fetches.

```sh
$V run search-metadata <<'EOF'
for (const path of ["/", "/fr/blog", "/ru/blog/nohorny-4-beta-8"]) {
  const { status, body } = await get(path, { "accept-language": "en" });
  const html = body.toString();
  const pick = (pattern) => html.match(pattern)?.[1];
  print(path, status, "|", pick(/<title>([^<]*)/),
    "| canonical", pick(/rel="canonical" href="([^"]*)/),
    "| og:locale", pick(/og:locale" content="([^"]*)/),
    "| card", pick(/og:image" content="([^"]*)/),
    "| alt", pick(/og:image:alt" content="([^"]*)/));
  const data = pick(/application\/ld\+json">(.*?)<\/script>/);
  if (data) {
    const graph = JSON.parse(data)["@graph"];
    print("   meta-structured:", graph.map((node) => node["@type"]));
    save(`${path.replaceAll("/", "_")}.json`, JSON.stringify(graph, null, 2));
  }
}
for (const card of ["/og/home.png", "/ru/og/blog.png", "/fr/og/blog/nohorny-4-beta-8.png", "/og/blog/nope.png"]) {
  const { status, headers, body } = await get(card);
  print("meta-cards:", card, status, headers["content-type"], body.length);
  if (status === 200) save(card.slice(1).replaceAll("/", "_"), body);
}
EOF
```

- **Expected.** Canonical URLs are on `https://xpdustry.com` with the page's own prefix; the card URL carries the same prefix; the sitemap has (2 + number of posts) × 3 URLs; the unknown card answers 404.
- **Look at the cards.** Open the saved PNGs with the Read tool. A card is wrong when its text is in the wrong language, falls back to a font without Cyrillic, or overflows the frame. Size alone proves nothing.
- **Breadcrumbs.** In a saved `.json` for a French or Russian post the first two names are translated (`Accueil` and `Blog` in French, `Главная` and `Блог` in Russian).

## Gotchas

- A post's card prints its path with the language prefix (`xpdustry.com/fr/blog/<slug>`); the home and blog cards print the plain labels `home` and `blog` in every language.
- Canonical and card URLs always name the production origin, not the local port; fetch the card by its path.
- Cards are cached in memory for an hour per language and path. After changing a card, relaunch (which `doctor` will demand anyway).
- With the default launch the home card has no GitHub star count. The count needs `--live`.
- Search engines cut titles near 60-70 characters and descriptions near 160. French and Russian run longer than English, so a faithful translation of a title often fails `seo`; shorten it.
- Read the head from `get()`, not from a browser page: the browser reorders and deduplicates tags.
