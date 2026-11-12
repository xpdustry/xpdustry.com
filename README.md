# xpdustry website

Source for [xpdustry.com](https://xpdustry.com), built with React and [TanStack Start](https://tanstack.com/start).

## Run locally

You need Node 24 or newer and pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

The development server runs at <http://localhost:3000>.

Run the full test and type-check suite with:

```bash
pnpm check
```

Before shipping, agents prove the built site behaves for a visitor with the [`verify-xpdustry` skill](.agents/skills/verify-xpdustry/SKILL.md): it serves the production build, drives it in a browser in every language, and keeps the evidence in `.verify/`.

## Compile and run

```bash
pnpm build
pnpm start
```

The build writes browser assets to `dist/client` and the server to `dist/server`. `pnpm start` serves both
with `scripts/serve.ts`.

Set the `PORT` env variable to change the server port. It defaults to `3000`.
Set `XPD_DISABLE_STATUS=1` to stop the server from polling the Mindustry servers, Discord and GitHub.

## Where things are

Code is grouped by feature: each folder under `src` holds a feature's components, their vanilla-extract styles
(`.css.ts`) beside them, its data, helpers and tests. What only the server runs sits in the feature's `server/`
folder, which the client build refuses to bundle.

- `src/routes`: the pages, plus the server routes (`/api/servers`, `/healthz`, `/og/*`, `/sitemap.xml`). They put the
  features together and stay thin.
- `src/shell`: what frames every page: the header, footer, backdrop, language switch, route announcer and the error
  and not-found pages.
- `src/landing`: the home page's sections, the gamemodes they list, and the pressable logo (`logo/`).
- `src/blog`: the post components, topics and releases. `content/` validates and loads the posts (with the Markdown
  plugin Vite runs) and `posts/` holds them.
- `src/status`: live server status: the server list, player counts and the Discord card, with the Mindustry poller and
  the Discord and GitHub fetchers in `server/`.
- `src/seo`: page metadata and structured data, with the social cards and redirects in `server/`.
- `src/textures`: what a texture is, the page's (`page.ts`) and the cards' (`cards.ts`), the components that paint them
  and the rendered files in `assets/`.
- `src/brand`: the site's name and links, the logo and wordmark, and the projects.
- `src/ui`: what every feature shares: the design tokens, type and corner scales, media queries and page grid
  (`styles/`), the cards, plinths, tray and icons, and the copy button (`copy/`).
- `src/_gt`, `src/i18n`, `gt.config.json`: translations, with [General Translation](https://generaltranslation.com/docs/react/tanstack-start-quickstart). English is the source; French and Russian live under `/fr` and `/ru`. Mark text with `<T>` or `useGT()` in components and `msg()` in data, then run `pnpm translations` to add it to the files in `src/_gt`, which hold the English until someone translates them. `src/i18n` also formats dates and numbers.
- `scripts`: the production server (`serve.ts`) and the build-time renderers. `pnpm textures` draws every texture into
  `src/textures/assets` and the relief logo's frames into `src/landing/logo` ahead of time; `pnpm pattern` first grows
  the reticulate pattern itself (`reticulate.png`), which takes a while.

Features import each other through `#app/...` and their own files by relative path. `pnpm architecture` checks the
boundaries in `.fallowrc.jsonc`: browser code never imports a `server/` folder, and the blog and live status are
reached only through the files they offer.

## Add a blog post

Create `src/blog/posts/en/<slug>.md`. A translation goes beside it as `src/blog/posts/<locale>/<slug>.md`; without one, the post reads in English under every locale. The filename becomes the URL, so `hello-world.md` is published at `/blog/hello-world`.

Start with this frontmatter:

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

`title`, `description`, `publishedAt`, `author`, and `topic` are required. Dates use `YYYY-MM-DD`.
`author` must match a username in `src/blog/content/authors.ts`.
A `topic` named after a project in `src/brand/projects.ts` dresses the post in that project's colours.

Useful optional fields:

- `updatedAt` is the last edit date.
- `topicVersion` is the version line the post is about, such as `"4"`. Titles that do not name their topic are
  prefixed with it: `Beta 11` under NoHorny 4 reads `NoHorny 4 Beta 11`.
- `hero` is the image behind the post on its cards, such as `/blog/screenshot.png`. Posts without one get a game screenshot.
- `releases` lists related releases as `owner/repository@tag`. A release can belong to only one post.

Put post images and videos in `public/blog/`. Use a media comment with explicit dimensions so the browser reserves the correct space before the file loads.

```md
<!-- ::post-image src="/blog/screenshot.png" alt="What the screenshot shows" width="1280" height="720" caption="Optional caption." -->
```

A video is an MP4 with a poster image, and optionally an AV1 WebM offered first. Its body is the fallback for browsers
that cannot play it:

```md
<!-- ::start:post-video src="/blog/clip.mp4" webm="/blog/clip.webm" poster="/blog/clip-poster.webp" width="1280" height="720" caption="Optional caption." -->

[Download the video](/blog/clip.mp4) if your browser cannot play it.

<!-- ::end:post-video -->
```

Callouts use GitHub-style Markdown:

```md
> [!WARNING] Upgrade first
> This release is not compatible with the previous version.
```

Then run `pnpm check`. Invalid frontmatter, broken media comments and duplicate release IDs fail the build.

## Attributions

- [Lucky Fireant](https://uiverse.io/ui-kits/lucky-fireant-71-b2686726) (Great UI kit, makes the buttons fun to press).
- [Fancy leopard pattern generator](https://github.com/mgmalheiros/reaction-diffusion)
  All I could find were goofy aah AI generators for this,
  until I found this absolute GEM from a Brazilian researcher. Say thank you to claude for porting it to js.
- [Phosphor](https://phosphoricons.com) for the icons, in their bold weight (see `THIRD_PARTY_NOTICES.md`).
