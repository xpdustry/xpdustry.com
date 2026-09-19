// Social cards, rendered on demand by takumi and kept for an hour.
//
// The cards are served from `/og/*` by `src/routes/og/[...card].ts`, and the
// pages point at them through `PageMeta`. Each path is rendered once per hour
// per process; the post and blog cards only change on deploy anyway, and the
// home card follows the GitHub counts, which refresh on the same schedule.

import archivo from "@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?inline";
import martian from "@fontsource/martian-mono/files/martian-mono-latin-400-normal.woff2?inline";
import martianBold from "@fontsource/martian-mono/files/martian-mono-latin-700-normal.woff2?inline";
import { NoHydration, renderToString, type JSX } from "@solidjs/web";
import { Renderer } from "@takumi-rs/core";
import { fromHtml } from "@takumi-rs/helpers/html";
import { posts } from "#app/content/registry";
import {
  BlogCard,
  CARD_HEIGHT,
  CARD_WIDTH,
  HomeCard,
  PostCard,
  type CardPost,
} from "#app/server/og/Card";
import { readRepositoryStats } from "#app/server/og/github";

const MAX_AGE_MS = 60 * 60 * 1000;

// Registered without a weight so the Archivo variable axis stays live.
const FONTS = [
  { name: "Archivo", data: bytes(archivo) },
  { name: "Martian", data: bytes(martian), weight: 400 },
  { name: "Martian", data: bytes(martianBold), weight: 700 },
];

type Png = Uint8Array<ArrayBuffer>;

interface Entry {
  png: Png;
  renderedAt: number;
}

const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<Png | undefined>>();
let renderer: Promise<Renderer> | undefined;

const cardPosts: readonly CardPost[] = posts.map((post) => ({
  slug: post.slug,
  title: post.frontmatter.title,
  author: post.frontmatter.author,
  topic: post.frontmatter.topic,
  publishedAt: post.frontmatter.publishedAt,
}));

function bytes(dataUri: string): Buffer {
  return Buffer.from(dataUri.slice(dataUri.indexOf(",") + 1), "base64");
}

// One renderer per process: it owns the parsed fonts and the decoded logo.
function getRenderer(): Promise<Renderer> {
  renderer ??= (async () => {
    const instance = new Renderer();
    for (const font of FONTS) await instance.registerFont(font);
    return instance;
  })();
  return renderer;
}

/** The component for a card path such as `home.png` or `blog/<slug>.png`, if there is one. */
async function view(card: string): Promise<(() => JSX.Element) | undefined> {
  if (card === "home.png") {
    const github = await readRepositoryStats();
    return () => <HomeCard github={github} />;
  }
  if (card === "blog.png") return () => <BlogCard posts={cardPosts} />;

  const slug = /^blog\/([^/]+)\.png$/.exec(card)?.[1];
  const post = cardPosts.find((entry) => entry.slug === slug);
  return post && (() => <PostCard post={post} />);
}

/**
 * Server-rendered as plain markup. The development build still emits hydration
 * comments around dynamic text, and takumi's parser drops the text with them.
 */
export function toHtml(card: () => JSX.Element): string {
  return renderToString(() => <NoHydration>{card()}</NoHydration>, { noScripts: true }).replaceAll(
    /<!--[\s\S]*?-->/g,
    "",
  );
}

export async function renderCard(card: () => JSX.Element): Promise<Png> {
  const { node, css } = fromHtml(toHtml(card));
  return (await getRenderer()).render(node, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    format: "png",
    css,
  });
}

/** The PNG for a card path, or `undefined` when no page owns it. */
export async function readCard(card: string): Promise<Png | undefined> {
  const cached = cache.get(card);
  if (cached && Date.now() - cached.renderedAt < MAX_AGE_MS) return cached.png;

  const pending = inflight.get(card);
  if (pending) return pending;

  const task = (async () => {
    const component = await view(card);
    if (component === undefined) return undefined;
    const png = await renderCard(component);
    cache.set(card, { png, renderedAt: Date.now() });
    return png;
  })().finally(() => inflight.delete(card));
  inflight.set(card, task);
  return task;
}
