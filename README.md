# xpdustry website

Source for [xpdustry.com](https://xpdustry.com), built with React and [TanStack Start](https://tanstack.com/start).

## Develop

You need Node 26 or newer and pnpm. Node 26 ships no Corepack, so install pnpm with npm: in this repository it switches itself to the version `package.json` names.

```bash
npm install --global pnpm
pnpm install
pnpm exec playwright install chromium firefox   # once, for the end-to-end tests
pnpm dev      # http://localhost:3000
pnpm check    # the fast loop: everything below but the end-to-end tests
pnpm test:e2e # the end-to-end tests, a few minutes; CI runs them on every push
```

## Check and test

`pnpm check` runs these in order, all but `pnpm test:e2e`, and stops at the first that fails. CI runs every one of them on
each push. Run the narrow one while you work.

| Command                | What it checks                                                                                                                                                        | Where                                                                |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `pnpm format:check`    | Formatting, fixed by `pnpm format`                                                                                                                                    | `.oxfmtrc.json`                                                      |
| `pnpm lint`            | Code rules with types, warnings included; hover outside `media.hover`; transitions of `all` or the layout; images without `alt`; en and em dashes and horizontal bars | `.oxlintrc.json`, `scripts/oxlint-plugin.ts`, `scripts/lint-text.ts` |
| `pnpm typecheck`       | Types                                                                                                                                                                 | `tsconfig.json`                                                      |
| `pnpm deadcode`        | Files, exports and dependencies nothing uses                                                                                                                          | `.fallowrc.jsonc`                                                    |
| `pnpm health`          | Functions too tangled to follow. The CRAP score is shown, not enforced: fallow guesses its coverage                                                                   | `.fallowrc.jsonc`                                                    |
| `pnpm architecture`    | Which folders may import which                                                                                                                                        | `.fallowrc.jsonc`                                                    |
| `pnpm test:unit`       | Logic, beside the code it tests                                                                                                                                       | `src/**/*.test.ts`, `scripts`                                        |
| `pnpm test:artifact`   | What the production server answers: pages, metadata, sitemap, crawler rules, redirects, headers                                                                       | `tests/artifact`                                                     |
| `pnpm test:e2e [file]` | What a visitor does and sees in Chromium: text that fits and grows with the browser's font size, touch targets, reduced motion; motion and popovers in Firefox too    | `tests/e2e`                                                          |

Only the entrance and spread tests paint the procedural textures: everywhere else `tests/support/test.ts` refuses the painter's worker, which is most of what a page load costs. The artifact and end-to-end tests build the site first when the source changed since the last build, and serve it on a free `127.0.0.1` port. `tests/artifact/__snapshots__/crawl.json` records what crawlers read of every page: when a change to it is intended, accept it with `pnpm test:artifact -u` and commit it. A failed end-to-end test leaves a screenshot and a trace in `test-results/`, opened with `pnpm exec playwright show-trace`.

What no test can judge (how a motion feels, whether a page or a social card looks right, live server status) is in the `verify-xpdustry` skill under `.agents/skills/`, which also serves the build and takes screenshots and videos of it.

## Run in production

```bash
pnpm build
pnpm start
```

Or build the `Dockerfile`. These environment variables matter:

- `PORT`: the port to listen on, `3000` by default.
- `XPD_DISABLE_STATUS=1`: stop polling the Mindustry servers, Discord and GitHub.
- `XPD_DISCORD_TOKEN` and `XPD_DISCORD_GUILD`: the bot that lists the team, and the server it lists. The bot needs the Server Members intent. Without them, the team is what `src/brand/team.json` names and tags. The team's faces and banners are copied off Discord's CDN at each refresh and served from `/discord/…`, so visitors never load anything from Discord.
- `XPD_TEAM_ROLE_OWNER`, `XPD_TEAM_ROLE_DEVELOPER`, `XPD_TEAM_ROLE_ADMIN` and `XPD_TEAM_ROLE_MODERATOR`: the role IDs that put someone on the team with that tag, comma separated. Each is optional.
- `XPD_TEAM_ACTIVE_DAYS`: how many days since their last message, in a channel the bot can read, someone stays on the team. `90` by default, `0` keeps everyone. The bot needs the Message Content intent and Read Message History to search; someone whose search Discord refuses stays.

`src/brand/team.json` adds, by Discord user ID, what Discord cannot know: a `name` over theirs, a `rank` over their highest role, extra `tags` like `developer`, an `about` line in each language, an `avatar` for the posts they sign, `github` and `website` links, or `hidden` to leave them off. Whoever it gives a `name` and a `rank` or `tags` is always on the team, with or without a role or a recent message.

## Layout

Code is grouped by feature under `src`. What only the server runs sits in a feature's `server/` folder.

| Folder     | Holds                                                        |
| ---------- | ------------------------------------------------------------ |
| `routes`   | Pages and server routes, kept thin                           |
| `shell`    | Header, footer, backdrop, language switch, error pages       |
| `landing`  | The home page's sections                                     |
| `blog`     | Post components, the content loader and the posts (`posts/`) |
| `status`   | Live server status and the pollers behind it                 |
| `seo`      | Metadata, structured data, social cards, redirects           |
| `textures` | Texture definitions and the painter that draws them          |
| `brand`    | Name, links, logo and projects                               |
| `ui`       | Design tokens and shared components                          |
| `i18n`     | Locales and formatting; translations are in `_gt`            |

`scripts` holds the production server and what makes the generated assets: the labyrinth every texture is painted from and the shapes the pressable logo is drawn with (`pnpm textures`).

## Translations

English is the source. French and Russian live under `/fr` and `/ru`, with
[General Translation](https://generaltranslation.com/docs/react/tanstack-start-quickstart).

Mark text with `<T>` or `useGT()` in components and `msg()` in data, run `pnpm translations`, then translate the new
entries in `src/_gt/fr.json` and `src/_gt/ru.json`.

## Add a blog post

Create `src/blog/posts/en/<slug>.md`. The filename becomes the URL: `hello-world.md` is published at
`/blog/hello-world`. A translation goes in `src/blog/posts/<locale>/<slug>.md`; without one the post reads in English.

```md
---
title: A useful title
description: A short description used in page metadata.
publishedAt: 2026-08-16
author: phinner
topic: NoHorny
---

Write the post here.
```

All five fields are required. `author` must be in `src/blog/content/authors.ts`, and a `topic` named after a project in
`src/brand/projects.ts` dresses the post in that project's colours.

Optional fields:

- `updatedAt`: the last edit date.
- `topicVersion`: the version line the post is about, such as `"4"`.
- `hero`: the image behind the post on its cards, such as `/blog/screenshot.png`.
- `releases`: related releases as `owner/repository@tag`.

Media goes in `public/blog/` and needs its dimensions:

```md
<!-- ::post-image src="/blog/screenshot.png" alt="What it shows" width="1280" height="720" caption="Optional." -->

<!-- ::start:post-video src="/blog/clip.mp4" webm="/blog/clip.webm" poster="/blog/clip-poster.webp" width="1280" height="720" -->

[Download the video](/blog/clip.mp4) if your browser cannot play it.

<!-- ::end:post-video -->
```

Callouts use GitHub's syntax and its five kinds (`NOTE`, `TIP`, `IMPORTANT`, `WARNING`, `CAUTION`), with an optional title
after the marker:

```md
> [!WARNING] Upgrade first
> This release is not compatible with the previous version.
```

`pnpm check` fails on invalid frontmatter, broken media comments and callouts of any other kind.

## Attributions

- [Lucky Fireant](https://uiverse.io/ui-kits/lucky-fireant-71-b2686726) (Great UI kit, makes the buttons fun to press).
- [Fancy leopard pattern generator](https://github.com/mgmalheiros/reaction-diffusion)
  All I could find were goofy aah AI generators for this,
  until I found this absolute GEM from a Brazilian researcher. Say thank you to claude for porting it to js.
- [Phosphor](https://phosphoricons.com) for the icons, in their bold weight (see `THIRD_PARTY_NOTICES.md`).
