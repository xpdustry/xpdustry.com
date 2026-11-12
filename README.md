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

- `src/routes`: the pages, plus the server routes (`/api/servers`, `/healthz`, `/og/*`, `/sitemap.xml`).
- `src/_gt`, `src/i18n`, `gt.config.json`: translations, with [General Translation](https://generaltranslation.com/docs/react/tanstack-start-quickstart). English is the source; French and Russian live under `/fr` and `/ru`. Mark text with `<T>` or `useGT()` in components and `msg()` in data, then run `pnpm translations` to add it to the files in `src/_gt`, which hold the English until someone translates them.
- `src/components`: the UI, each with its styles beside it as a vanilla-extract `.css.ts` file. `src/styles` holds what they share: the design tokens (`theme.css.ts`), the type and corner scales (`scale.ts`), the media queries (`media.ts`) and the page grid (`pageGrid.ts`, `layout.css.ts`).
- `src/data`: the projects, gamemodes and servers the home page shows, the site's links, and the textures (`textures.ts` for the page's, `patches.ts` for the cards').
- `src/lib`: what the pages share besides components: the icons, SEO and structured data, formatting, and what a texture is (`textures.ts`).
- `src/content`: the blog posts and their authors.
- `src/server`: everything that only runs on the server: the Mindustry status poller, the Discord and GitHub
  fetchers, and the social cards.
- `scripts`: the production server (`serve.ts`) and the build-time renderers. `pnpm textures` draws every texture and the
  relief logo's frames into `src/assets` ahead of time; `pnpm pattern` first grows the reticulate pattern itself
  (`reticulate.png`), which takes a while.

## Add a blog post

Create `src/content/blog/en/<slug>.md`. A translation goes beside it as `src/content/blog/<locale>/<slug>.md`; without one, the post reads in English under every locale. The filename becomes the URL, so `hello-world.md` is published at `/blog/hello-world`.

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
`author` must match a username in `src/content/authors.ts`.
A `topic` named after a project in `src/data/projects.ts` dresses the post in that project's colours.

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
