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
- `src/components`: the UI, one CSS module per component. Design tokens live in `src/styles/global.css`.
- `src/data`: the projects, gamemodes and servers the home page shows, and the site's links.
- `src/content`: the blog posts and their authors.
- `src/server`: everything that only runs on the server: the Mindustry status poller, the Discord and GitHub
  fetchers, and the social cards.
- `src/lib/reticulate`: the reticulate pattern's renderer; `pnpm textures` draws every texture with it ahead of time.

## Add a blog post

Create `src/content/blog/<slug>.md`. The filename becomes the URL, so `hello-world.md` is published at `/blog/hello-world`.

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
- `hero` is the image behind the post on its cards, such as `/blog/screenshot.png`. Posts without one get a game screenshot.
- `releases` lists related releases as `owner/repository@tag`. A release can belong to only one post.

Put post images and videos in `public/blog/`. Use a media comment with explicit dimensions so the browser reserves the correct space before the file loads.

```md
<!-- ::post-image src="/blog/screenshot.png" alt="What the screenshot shows" width="1280" height="720" caption="Optional caption." -->
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
