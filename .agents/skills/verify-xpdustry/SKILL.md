---
name: verify-xpdustry
description: "Serve a production build of the Xpdustry website (xpdustry.com: TanStack Start, served by scripts/server/serve.ts) for someone to look at, and capture screenshots, ARIA trees and videos of it as evidence. Use after a visible change, to reply with screenshots; for live server status against the real game servers, Discord and GitHub; and for what no test can judge: how an animation feels, whether a social card or a page looks right."
---

# Verify Xpdustry

What a machine can judge is tested: `pnpm check` runs all of it but the end-to-end tests, which `pnpm test:e2e` and CI run. This skill is for the rest: showing what changed, and the checks that need eyes or the real outside world.

## What the tests already prove

Run the narrow one while you work; `pnpm check && pnpm test:e2e` runs all of them.

| What                                                                                                                                                                                | Where                                                          | Run                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Pages, metadata, sitemap, crawler rules, redirects, headers, caching, languages by address, the API                                                                                 | `tests/artifact/`                                              | `pnpm test:artifact`                                                     |
| What crawlers read of every page, against its snapshot                                                                                                                              | `tests/artifact/crawl.test.ts`                                 | `pnpm exec vitest run --project artifact crawl`, `-u` to accept a change |
| Hydration, the language switch, copying addresses, the team and its profiles, opening a post                                                                                        | `tests/e2e/`                                                   | `pnpm test:e2e <file>`, as in `pnpm test:e2e copy`                       |
| The texture entrance, the spreads and the team's popovers, in Chromium and Firefox                                                                                                  | `tests/e2e/entrance.test.ts`, `spread.test.ts`, `team.test.ts` | `pnpm test:e2e entrance --project firefox`                               |
| Text that no longer fits or grows with the browser's font size, a header over two rows, project art over text: 4 pages, up to 7 widths and 3 languages, 4 text settings, 224 states | `tests/e2e/fit.test.ts`                                        | `pnpm test:e2e fit`, or `-g " /fr/blog fits"` for one page               |
| Hover outside `media.hover`, transitions of `all` or the layout, images without `alt`, en and em dashes and horizontal bars                                                         | `pnpm lint`                                                    | `pnpm lint`                                                              |
| Touch targets, reduced motion, the language list without anchor positioning                                                                                                         | `tests/e2e/controls.test.ts`, `popover-fallback.test.ts`       | `pnpm test:e2e controls`                                                 |

When a test fails, `test-results/` holds its screenshot and a trace: `pnpm exec playwright show-trace <trace.zip>`. When a translation, a heading or a post changes what crawlers read on purpose, accept the snapshot with `-u` and commit it with the change.

## Launch

```sh
V="node .agents/skills/verify-xpdustry/verify.ts"
$V launch          # build if the source changed, serve on a free 127.0.0.1 port
$V launch --live   # the same, polling the real Mindustry servers, Discord and GitHub
$V doctor          # is it this checkout's server, healthy, and built from the current source?
$V stop
```

Shell state does not carry between tool calls: start every command with the `V=` line. Run `pnpm install` once, and `pnpm exec playwright install chromium firefox` on a machine that has never run Playwright.

- `ready: http://127.0.0.1:<port>` means it serves. The instance is recorded in `.verify/instance.json`, its log is `.verify/server.log`.
- Without `--live` the server makes no outside request: player counts read "Checking", and the Discord and GitHub figures are absent.
- One instance per checkout. `launch` refuses while another server of this checkout's `dist/` runs, as `pnpm start` does: a build would replace its files under it.
- After an edit `doctor` and `run` say the source changed: `stop`, then `launch`.
- Never point this at the developer's `pnpm dev` server or the deployed site.

## Capture evidence

Pipe a script to `run`, with a label that names its evidence folder. The script is the body of an async function:

```sh
$V run header <<'EOF'
const page = await newPage({ width: 390, language: "fr" });
await go(page, "/");
await page.getByRole("button", { name: "Menu" }).click();
await snap(page, "menu-open");
EOF
```

| Name                                                                                                       | What it is                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `newPage({ width = 1280, height = 800, language = "en", motion = false, scripts = true, record = false })` | A fresh visitor, as a Playwright `Page`. Motion is reduced unless `motion` is true. `scripts: false` works in Chromium only. `record: true` keeps a video of the visit. |
| `go(page, path)`                                                                                           | Navigate and wait for the network and the fonts to settle.                                                                                                              |
| `get(path, headers)`                                                                                       | A plain GET that sends only `headers` and follows no redirect, as a `Response`.                                                                                         |
| `snap(page, name)`                                                                                         | Save `name.png` and `name.aria.txt` (URL, title and ARIA tree).                                                                                                         |
| `save(name, content)`, `print(...)`                                                                        | Keep a string or bytes; print a line, also kept in `output.txt`.                                                                                                        |
| `base`, `browser`, `evidence`                                                                              | The instance URL, the Playwright browser, the evidence folder.                                                                                                          |

`--browser firefox` after the label runs the script in Firefox. A script that throws leaves `failure-*.png` of every open page and exits 1. Each run writes `.verify/evidence/<date>-<time>-<label>/`, which is git-ignored: cite it, and attach the screenshots to your reply.

Find elements by role and accessible name, never by generated class names. Sections have stable ids: `#servers`, `#gamemodes`, `#news`, `#projects`, `#team`. Names are translated: find the English text in `src/_gt/en.json` and read the same key in `fr.json` or `ru.json`. Up to 1160px the navigation is in the `Menu`, and up to 680px the language list too.

A screenshot proves what it shows. Look at it before you cite it: text in the wrong language, a fallback font, a cut word or an overlap are failures even when every test passes. For a change that moves, record it.

## What only a person or the real world can check

Each file says how to get there and what to judge. Read the [index](features/README.md).

- [Live status](features/live-status.md): counts from the real game servers, Discord and GitHub, and the team as Discord lists it.
- [Texture entrance](features/texture-entrance.md) and [copy spreads](features/copy-server-address.md): how the motion feels.
- [Social cards](features/search-metadata.md): whether each card reads well in its language.
