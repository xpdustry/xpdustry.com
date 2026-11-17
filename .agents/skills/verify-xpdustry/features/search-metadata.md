# Social cards

Every page has a card that link previews show, drawn by the server in the page's language. `tests/artifact/crawl.test.ts` proves each card answers as a 1200x630 PNG, and `caches.test.ts` that only the address picks its language; neither can see whether the card reads well.

## How to get to it (user POV)

- Paste a page link into Discord or another app that previews links.
- Open `/og/home.png`, `/fr/og/blog.png` or `/ru/og/blog/<slug>.png` directly.

## Capturing it

Default launch, `doctor` passes.

```sh
$V run cards <<'EOF'
for (const card of ["/og/home.png", "/og/blog.png", "/fr/og/blog.png", "/ru/og/blog/nohorny-4-beta-8.png"]) {
  save(card.slice(1).replaceAll("/", "_"), new Uint8Array(await (await get(card)).arrayBuffer()));
}
EOF
```

## What to judge

Open each saved PNG. A card is wrong when its text is in the wrong language, falls back to a font without Cyrillic, or leaves its frame. A post's card prints its path with the language prefix (`xpdustry.com/fr/blog/<slug>`); the home and blog cards print `home` and `blog` in every language. Without `--live` the home card has no GitHub star count.
