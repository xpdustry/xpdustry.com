# xpdustry website

Source for [xpdustry.com](https://www.xpdustry.com).

## Run locally

You need Node 22 or newer and pnpm.

```bash
corepack enable
pnpm install
pnpm dev
```

The development server runs at <http://localhost:3000>. The `/styleguide` route is available in development.

Run the full test and type-check suite with:

```bash
pnpm check
```

## Compile and run

```bash
pnpm build
pnpm start
```

The build writes browser assets to `dist/client` and the Node server to `dist/server`.

Set the `PORT` env variable to change the server port. It defaults to `3000`.

## Add a blog post

Create `src/content/blog/<slug>.md`. The filename becomes the URL, so `hello-world.md` is published at `/blog/hello-world`.

Start with this frontmatter:

```md
---
title: A useful title
description: A short description used in page metadata.
publishedAt: 2026-08-16
author: phinner
pfp: /phinner.svg
topic: NoHorny
---

Write the post here.
```

`title`, `description`, `publishedAt`, `author`, and `topic` are required. Dates use `YYYY-MM-DD`.

Useful optional fields:

- `updatedAt` is the last edit date.
- `pfp` is the author's avatar URL.
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

Then run `pnpm check`. Invalid frontmatter and duplicate release IDs fail the build.

## Attributions

- [Noise texture](https://commons.wikimedia.org/wiki/File:512x512_Dissolve_Noise_Texture.png) (`src/assets/grain-250.png`).
- [Lucky Fireant](https://uiverse.io/ui-kits/lucky-fireant-71-b2686726) (Great UI kit, makes the buttons fun to press).
- [Fancy leopard pattern generator](https://github.com/mgmalheiros/reaction-diffusion)
  All I could find were goofy aah AI generators for this,
  until I found this absolute GEM from a Brazilian researcher. Say thank you to claude for porting it to js.

## TODO

- [ ] Nuke AI tests (oh my god gpt, why do you need to test EVERY BUTTON)
- [ ] Nuke AI code comments (yes I know, water is wet and the earth is flat...)
- [ ] Unslopify the CSS (I made great progress but more cleanup passes are needed)
- [ ] Simplify the codegen tool