---
name: verify-xpdustry
description: "Drive a production build of the Xpdustry website (xpdustry.com: TanStack Start, served by scripts/serve.ts) in a real browser and over HTTP, and capture proof that a page, a language, the blog, the copy-address buttons, search metadata or live server status works. Use before shipping, after changing UI, routes, translations or SEO, and whenever `pnpm check` passing is not enough evidence."
---

# Verify Xpdustry

`pnpm check` proves the code compiles and the built server answers. This skill proves what a visitor gets: it serves the production build on its own port, drives it with Playwright, and keeps screenshots, ARIA trees and transcripts.

Everything goes through one helper, run from the repository root:

```sh
V="node .agents/skills/verify-xpdustry/verify.ts"
```

Shell state does not carry between tool calls, so start every command with that `V=` line.

Run `pnpm install` first: the helper uses the repo's own `playwright` dev dependency. A machine that has never run it also needs the browser once: `pnpm exec playwright install chromium`. The helper says which of the two is missing.

## Launch

```sh
$V launch          # build, serve on a free 127.0.0.1 port, wait until / and /fr/blog render
$V launch --live   # same, with status polling on
```

Ready is the line `ready: http://127.0.0.1:<port>`. The instance is recorded in `.verify/instance.json` and its log is `.verify/server.log`.

- Without `--live` the server makes no outside requests: player counts read "Checking" and the Discord and GitHub figures are absent. Use this for everything except [live status](features/live-status.md).
- With `--live` it queries the real Mindustry servers, Discord and the GitHub API every 30 seconds. Those are public, read-only requests.
- One instance per checkout; `launch` refuses while one runs. Separate checkouts get separate ports and never collide.
- The site has no database, accounts or seed data. Content is the Markdown under `src/content/blog/` and the strings in `src/_gt/`, all compiled into the build.
- Never drive the developer's `pnpm dev` server or the deployed site with these recipes.

## Doctor

```sh
$V doctor
```

Read-only. It exits 0 only when the recorded process is still this checkout's server, `/healthz` reports `ok`, the home page renders, and no source file changed since the build. Run it first whenever a result looks wrong. `run`, `audit` and `seo` refuse the same way on a stale build. After any edit it fails with "source changed since the build": `$V stop`, then `$V launch`.

## Drive

Pipe JavaScript to `run`, with a label that names the evidence folder. The script is the body of an async function, so `await` works at the top level:

```sh
$V run languages <<'EOF'
const page = await newPage({ width: 390, language: "fr" });
await go(page, "/");
print(page.url());
await snap(page, "home");
EOF
```

The script gets:

| Name                                                       | What it is                                                                                                                                                                               |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newPage({ width = 1280, height = 800, language = "en" })` | A fresh visitor (no cookies) as a Playwright `Page`. `language` is the browser language. Clipboard access is granted and motion is reduced.                                              |
| `go(page, path)`                                           | Navigate to a site path and wait for the network and fonts to settle.                                                                                                                    |
| `get(path, headers)`                                       | Plain HTTP GET that does not follow redirects: `{ status, headers, body }`, with lower-case header names and `body` as a `Buffer`. Use it for redirects, feeds, images and status codes. |
| `snap(page, name)`                                         | Save `name.png` and `name.aria.txt` (URL, title and ARIA tree) to the evidence folder.                                                                                                   |
| `save(name, content)`                                      | Save a string or bytes as evidence.                                                                                                                                                      |
| `print(...)`                                               | Like `console.log`, also written to `output.txt` in the evidence folder.                                                                                                                 |
| `base`, `browser`, `evidence`                              | The instance URL, the Playwright browser and the evidence folder.                                                                                                                        |

When a script throws, the helper prints the failing line of your script, saves `failure-*.png` of every open page, and exits 1.

Find elements by role and accessible name (`page.getByRole("button", { name: "Language: English" })`), never by generated class names: they change on every build. Sections have stable ids: `#servers`, `#gamemodes`, `#news`, `#projects`. Names are translated: `src/_gt/*.json` are keyed by a hash, so find the English text in `src/_gt/en.json` and read the same key in `fr.json` or `ru.json`. Below 520px the navigation links and the language button are not in the accessibility tree until the `Menu` button is pressed; wait for the `h1` or the `Menu` button, and expect the menu to close after a language is chosen. Client-side navigation changes the URL before the new page paints, so wait for something on the new page (`await page.getByRole("heading", { level: 1, name: "…" }).waitFor()`), not only for the URL.

Each [feature file](features/README.md) has the exact script for its journeys. Read the index first.

```sh
$V audit                   # every language, 8 widths, 5 pages (about a minute)
$V audit fr               # one language
```

`audit` looks for translated text that no longer fits: a page that scrolls sideways, a navigation item that wraps, a section title that runs under its button, a truncated section subtitle, text that leaves the screen. The widths are 1440, 1280, 1160, 1000, 760, 600, 390 and 320px. It prints one line per finding, as `<width> <url>: <what>`, and exits 1 if there is any. It is the check for visible text; `seo` does not notice a label that wraps. Run it after every change to `src/_gt/*.json`, to a heading, or to layout styles.

```sh
$V seo            # every sitemap page: fixed rules, then a comparison with the baseline
$V seo --accept   # record the current state as the new baseline
```

`seo` reads every page in the sitemap as served, with scripts off and no cookies, the way a crawler does, and exits 1 on either kind of finding:

- `PROBLEM` lines break a rule that always holds: a sitemap page that is not 200, a title over 70 characters or a description outside 50-170, a duplicated title or description, a canonical that is not the page's own production URL, `noindex`, the wrong `<html lang>`, not exactly one `h1`, `hreflang` links that are incomplete or not returned by the other language, missing Open Graph tags, a card image that does not load, structured data that does not parse, an image without `alt`, an internal link that redirects or 404s or leads to a page missing from the sitemap. Fix these.
- `CHANGED` lines differ from `seo-baseline.json` beside this file: a page added or gone, or a page's title, description, `h1`, canonical, card, structured data types, word count or link count. Read each one. An intended change is accepted with `--accept` and the baseline is committed with it; an unintended one (a page that lost half its words, a title that reverted to English) is the regression this exists to catch.

It needs the default launch and refuses a `--live` one, because live counts change the page text it compares.

Run it after any change to routes, `src/lib/seo.ts`, `src/lib/structuredData.ts`, the sitemap, page headings, posts or `src/_gt/*.json`.

## Evidence

Each `run` writes `.verify/evidence/<date>-<time>-<label>/` (local time): the script as `drive.js`, `output.txt`, and whatever it snapped or saved. `audit` and `seo` write their findings to an `output.txt` in a folder of their own. `.verify/` is git-ignored. Cite the folder when you report a result.

A proof is acceptable when it:

- goes through what a visitor does (a click, a typed URL, a browser language), not through component props, router internals or a unit test;
- records the action and the state after it: the URL, the `lang`, the clipboard, the announced status, not only a final screenshot;
- checks the side effect itself. For a copy button that is the clipboard content; for a language choice it is the `generaltranslation.locale` cookie and where `/` lands afterwards;
- states which launch mode it used. A journey that needs `--live` and ran without it is skipped, not passed.

Report a journey you could not run with the command you tried and what was missing. Do not count it as verified through another path.

## Cleanup

```sh
$V stop
```

It signals only the process group this checkout launched, after checking the pid still is that server, and removes `.verify/instance.json`. It never kills by name and never touches `.verify/evidence/`. Run it after a failed attempt too. Evidence folders accumulate; delete old ones by hand when they are no longer cited.
