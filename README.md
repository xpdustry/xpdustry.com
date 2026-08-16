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

Create `src/content/blog/<slug>.mdx`. The filename becomes the URL, so `hello-world.mdx` is published at `/blog/hello-world`.

Start with this frontmatter:

```mdx
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

Put post images and videos in `src/assets/blog/`, then import them from the MDX file. Use `PostImage` or `PostVideo` so the browser reserves the correct space before the media loads.

```mdx
import { PostImage } from "#app/components/content/Media";
import screenshot from "#app/assets/blog/screenshot.png";

<PostImage
  src={screenshot}
  alt="What the screenshot shows"
  width={1280}
  height={720}
  caption="Optional caption."
/>
```

Then run `pnpm check`. Invalid frontmatter and duplicate release IDs fail the build.

## TODO

- [ ] Nuke AI tests (oh my god gpt, why do you need to test EVERY BUTTON)
- [ ] Nuke AI code comments (yes I know, water is wet and the earth is flat...)
- [ ] Unslopify the CSS (I made great progress but more cleanup passes are needed)
