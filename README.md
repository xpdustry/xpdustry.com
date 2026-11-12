# xpdustry website

Source for [xpdustry.com](https://xpdustry.com), built with React and [TanStack Start](https://tanstack.com/start).

## Develop

You need Node 26 or newer and pnpm.

```bash
corepack enable
pnpm install
pnpm dev      # http://localhost:3000
pnpm check    # format, lint, types, tests and a production build
```

## Run in production

```bash
pnpm build
pnpm start
```

Or build the `Dockerfile`. Two environment variables matter:

- `PORT`: the port to listen on, `3000` by default.
- `XPD_DISABLE_STATUS=1`: stop polling the Mindustry servers, Discord and GitHub.

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
| `textures` | Texture definitions and the rendered files                   |
| `brand`    | Name, links, logo and projects                               |
| `ui`       | Design tokens and shared components                          |
| `i18n`     | Locales and formatting; translations are in `_gt`            |

`scripts` holds the production server and the texture renderers (`pnpm textures`).

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

Callouts use GitHub's syntax:

```md
> [!WARNING] Upgrade first
> This release is not compatible with the previous version.
```

`pnpm check` fails on invalid frontmatter and broken media comments.

## Attributions

- [Lucky Fireant](https://uiverse.io/ui-kits/lucky-fireant-71-b2686726) (Great UI kit, makes the buttons fun to press).
- [Fancy leopard pattern generator](https://github.com/mgmalheiros/reaction-diffusion)
  All I could find were goofy aah AI generators for this,
  until I found this absolute GEM from a Brazilian researcher. Say thank you to claude for porting it to js.
- [Phosphor](https://phosphoricons.com) for the icons, in their bold weight (see `THIRD_PARTY_NOTICES.md`).
