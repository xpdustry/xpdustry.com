import dmMono from "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2?inline";
import momo from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?inline";
import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import type { ReactElement } from "react";
import { posts } from "#app/content/registry";
import { projects } from "#app/data/projects";
import { servers } from "#app/data/servers";
import { topic } from "#app/data/topics";
import { CARD_SIZE, postTitle } from "#app/lib/seo";
import { BlogCard, HomeCard, PostCard, type CardPost } from "#app/server/og/Card";
import { services } from "#app/server/services";

const MAX_AGE_MS = 60 * 60 * 1000;

const FONTS = [
  { name: "Momo Trust Display", data: bytes(momo), weight: 400 },
  { name: "DM Mono", data: bytes(dmMono), weight: 400 },
];

const iconData = import.meta.glob<string>("/src/assets/brand/*", {
  query: "?inline",
  import: "default",
  eager: true,
});
const iconUrls = import.meta.glob<string>("/src/assets/brand/*", {
  query: "?url",
  import: "default",
  eager: true,
});
const inlineIcons = new Map(Object.entries(iconUrls).map(([file, url]) => [url, iconData[file]!]));

function inlineIcon(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("data:") ? url : inlineIcons.get(url);
}

const cardPosts: readonly CardPost[] = posts.map((post) => ({
  slug: post.slug,
  title: postTitle(post.frontmatter),
  author: post.frontmatter.author,
  topic: post.frontmatter.topic,
  publishedAt: post.frontmatter.publishedAt,
  icon: inlineIcon(topic(post.frontmatter.topic).icon),
}));

type Png = Uint8Array<ArrayBuffer>;

const cache = new Map<string, { png: Png; renderedAt: number }>();
const inflight = new Map<string, Promise<Png | undefined>>();
let renderer: Promise<Renderer> | undefined;

function bytes(dataUri: string): Buffer {
  return Buffer.from(dataUri.slice(dataUri.indexOf(",") + 1), "base64");
}

function getRenderer(): Promise<Renderer> {
  renderer ??= (async () => {
    const instance = new Renderer();
    for (const font of FONTS) await instance.registerFont(font);
    return instance;
  })();
  return renderer;
}

function cardFor(path: string): ReactElement | undefined {
  if (path === "home.png") {
    const stars = services().github.value?.stars;
    return <HomeCard stats={{ projects: projects.length, servers: servers.length, stars }} />;
  }
  if (path === "blog.png") return <BlogCard posts={cardPosts} />;

  const slug = /^blog\/([^/]+)\.png$/.exec(path)?.[1];
  const post = cardPosts.find((entry) => entry.slug === slug);
  return post && <PostCard post={post} />;
}

async function renderCard(card: ReactElement): Promise<Png> {
  const { node, css } = await fromJsx(card);
  const png = await (await getRenderer()).render(node, { ...CARD_SIZE, format: "png", css });
  return new Uint8Array(png);
}

/** The PNG for a card path, or `undefined` when no page owns it. */
export async function readCard(path: string): Promise<Png | undefined> {
  const cached = cache.get(path);
  if (cached && Date.now() - cached.renderedAt < MAX_AGE_MS) return cached.png;

  const pending = inflight.get(path);
  if (pending) return pending;

  const task = (async () => {
    const card = cardFor(path);
    if (!card) return undefined;
    const png = await renderCard(card);
    cache.set(path, { png, renderedAt: Date.now() });
    return png;
  })().finally(() => inflight.delete(path));
  inflight.set(path, task);
  return task;
}
