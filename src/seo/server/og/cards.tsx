import dmMono from "@fontsource/dm-mono/files/dm-mono-latin-400-normal.woff2?inline";
import golosBold from "@fontsource/golos-text/files/golos-text-cyrillic-700-normal.woff2?inline";
import plexMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-cyrillic-400-normal.woff2?inline";
import momo from "@fontsource/momo-trust-display/files/momo-trust-display-latin-400-normal.woff2?inline";
import { Renderer } from "@takumi-rs/core";
import { fromJsx } from "@takumi-rs/helpers/jsx";
import type { ReactElement } from "react";
import { posts, translated, type Post } from "#app/blog/content/registry";
import { postTitle } from "#app/blog/titles";
import { topic } from "#app/blog/topics";
import { projects } from "#app/brand/projects";
import { services } from "#app/status/server/services";
import { servers } from "#app/status/servers";
import { DISPLAY_WEIGHT, FACE } from "#app/ui/styles/fonts";
import { CARD_SIZE } from "../../meta";
import { BlogCard, HomeCard, PostCard, type CardLanguage, type CardPost } from "./Card";

const MAX_AGE_MS = 60 * 60 * 1000;

const FONTS = [
  { name: FACE.display, data: bytes(momo), weight: DISPLAY_WEIGHT },
  { name: FACE.mono, data: bytes(dmMono), weight: 400 },
  { name: FACE.cyrillicDisplay, data: bytes(golosBold), weight: DISPLAY_WEIGHT },
  { name: FACE.cyrillicMono, data: bytes(plexMono), weight: 400 }
];

const iconData = import.meta.glob<string>("/src/brand/icons/*", {
  query: "?inline",
  import: "default",
  eager: true
});
const iconUrls = import.meta.glob<string>("/src/brand/icons/*", {
  query: "?url",
  import: "default",
  eager: true
});
const inlineIcons = new Map(Object.entries(iconUrls).map(([file, url]) => [url, iconData[file]!]));

function inlineIcon(url: string | undefined): string | undefined {
  if (!url) return undefined;
  return url.startsWith("data:") ? url : inlineIcons.get(url);
}

function cardPost(original: Post, locale: string): CardPost {
  const post = translated(original, locale);
  return {
    slug: post.slug,
    title: postTitle(post.frontmatter),
    author: post.frontmatter.author,
    topic: post.frontmatter.topic,
    publishedAt: post.frontmatter.publishedAt,
    icon: inlineIcon(topic(post.frontmatter.topic).icon)
  };
}

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

type DrawCard = (language: CardLanguage) => ReactElement;

/** Every card the site serves, by its path under `/og/`. */
const CARDS = new Map<string, DrawCard>([
  [
    "home.png",
    (language) => (
      <HomeCard
        stats={{
          projects: projects.length,
          servers: servers.length,
          stars: services().github.value?.stars
        }}
        {...language}
      />
    )
  ],
  [
    "blog.png",
    (language) => (
      <BlogCard posts={posts.map((post) => cardPost(post, language.locale))} {...language} />
    )
  ],
  ...posts.map((post): [string, DrawCard] => [
    `blog/${post.slug}.png`,
    (language) => <PostCard post={cardPost(post, language.locale)} {...language} />
  ])
]);

async function renderCard(card: ReactElement): Promise<Png> {
  const { node, css } = await fromJsx(card);
  const png = await (await getRenderer()).render(node, { ...CARD_SIZE, format: "png", css });
  return new Uint8Array(png);
}

/** The PNG for a card path in `language`, or `undefined` when no page owns it. */
export async function readCard(path: string, language: CardLanguage): Promise<Png | undefined> {
  const key = `${language.locale}/${path}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.renderedAt < MAX_AGE_MS) return cached.png;

  const pending = inflight.get(key);
  if (pending) return pending;

  const task = (async () => {
    const card = CARDS.get(path)?.(language);
    if (!card) return undefined;
    const png = await renderCard(card);
    cache.set(key, { png, renderedAt: Date.now() });
    return png;
  })().finally(() => inflight.delete(key));
  inflight.set(key, task);
  return task;
}
