# Blog

Release notes and articles, written as Markdown in `src/content/blog/<locale>/`. The index lists every post newest first; a post page renders its text, images, video and callouts, and offers the neighbouring posts.

## Sub-features

- `blog-index` lists every post once, with the newest as the lead.
- `blog-post` renders a post: title with its topic, body, callouts, images with captions.
- `blog-translated` serves a post's French or Russian file under the prefix, with the date in that language.
- `blog-fallback` serves the English text under a prefix when a post has no translation.
- `blog-missing` answers 404 for an unknown post and redirects a trailing slash.

## How to get to it (user POV)

- Choose `Blog` in the header.
- Choose a card under `Latest news` on the home page, or its arrow for the index.
- Choose a card on the index, or under `More posts` at the end of a post.
- Type `/blog/<slug>`; the slug is the Markdown filename.

## Driving it with verify.ts

Preconditions: default launch, `doctor` passes.

```sh
$V run blog <<'EOF'
const oneLine = (text) => text.split(/\s+/).join(" ");
const page = await newPage({ width: 1280 });
await go(page, "/blog");
const links = await page.locator('main a[href^="/blog/"]').evaluateAll((els) => els.map((el) => el.getAttribute("href")));
print("blog-index:", new Set(links).size, "posts"); // equals the number of files in src/content/blog/en

await page.locator('main a[href="/blog/nohorny-4-beta-8"]').first().click();
await page.getByRole("heading", { level: 1, name: "Beta 8" }).waitFor();
print("blog-post:", oneLine(await page.getByRole("heading", { level: 1 }).innerText()),
  "| callouts:", await page.getByRole("complementary").filter({ hasText: "Breaking change" }).count(),
  "| images:", await page.locator("main figure img").count());
await snap(page, "1-post-en");

await go(page, "/ru/blog/nohorny-4-beta-8");
print("blog-translated:", oneLine(await page.getByRole("heading", { level: 1 }).innerText()),
  "|", await page.locator("time").first().innerText());
await snap(page, "2-post-ru");

const slash = await get("/blog/");
print("blog-missing:", (await get("/blog/nope")).status, slash.status, slash.headers.location); // 404 308 /blog
EOF
```

- **Expected.** The Russian heading is in Cyrillic and the date reads like `20 июля 2026 г.`; a Russian page that shows the English title means the file under `src/content/blog/ru/` is missing or failed validation at build time.
  Variants:

- **A new post.** Replace the slug and the heading name with the new post's; check its images load (`await page.locator("main figure img").evaluateAll((els) => els.every((el) => el.complete && el.naturalWidth > 0))`) after scrolling, since they load lazily.
- **blog-fallback.** Only provable when a post lacks a translation. Today every post has all three, so report it as not exercised.

## Gotchas

- Post bodies are separate chunks loaded on navigation; waiting only for the URL reads the previous page's heading.
- The page title joins the topic and its version with the post title (`NoHorny 4 Beta 8: …`), on two lines in the heading.
- Videos stay paused under automation and reduced motion; assert the `<video>` element and its poster, not playback.
