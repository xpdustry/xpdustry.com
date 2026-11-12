import { msg } from "gt-tanstack-start";
import type { CSSProperties, ReactNode } from "react";
import { BLOG_DESCRIPTION } from "#app/blog/titles";
import logo from "#app/brand/logo.svg?raw";
import { SITE } from "#app/brand/site";
import { formatNumber, formatShortDate } from "#app/i18n/format";
import { withLocale } from "#app/i18n/localePath";
import texture from "#app/textures/assets/reticulate.png?inline";
import { FACE } from "#app/ui/styles/fonts";
import { CARD_SIZE } from "../../meta";

export interface CardPost {
  slug: string;
  title: string;
  author: string;
  topic: string;
  publishedAt: string;
  /** The topic's icon as a data URI, when it has one. */
  icon?: string;
}

export interface HomeStats {
  projects: number;
  servers: number;
  /** Dropped rather than faked while GitHub has not answered. */
  stars?: number;
}

const color = {
  ground: "#135854",
  accent: "#41c1ba",
  ink: "#eaf7f5",
  muted: "#a9d4cf",
  faint: "#78aaa5",
  hair: "rgba(255,255,255,.14)"
} as const;

export interface CardLanguage {
  locale: string;
  m: (message: string) => string;
}

const LABEL = {
  projects: msg("Projects"),
  stars: msg("Stars"),
  servers: msg("Servers"),
  posts: msg("Posts"),
  latest: msg("Latest"),
  author: msg("Author"),
  published: msg("Published"),
  topic: msg("Topic")
};

const DISPLAY = `${FACE.display}, ${FACE.cyrillicDisplay}`;
const MONO = `${FACE.mono}, ${FACE.cyrillicMono}`;

const host = SITE.origin.replace("https://", "");
const LOGO = `data:image/svg+xml;base64,${Buffer.from(logo.replace(/<\?xml[^>]*\?>/, "")).toString("base64")}`;

function Frame({ mark, stats, children }: { mark: string; stats: ReactNode; children: ReactNode }) {
  return (
    <div
      style={{
        position: "relative",
        width: CARD_SIZE.width,
        height: CARD_SIZE.height,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        padding: "72px 80px 66px",
        background: color.ground,
        color: color.ink,
        fontFamily: DISPLAY
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          background: `url(${texture}) 0 0 / 300px 300px`,
          maskImage: "linear-gradient(115deg, transparent 22%, #000 78%)"
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 56
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>{children}</div>
        <img
          src={mark}
          alt=""
          width={200}
          height={200}
          style={{ flex: "none", objectFit: "contain" }}
        />
      </div>
      <div style={{ position: "relative", marginTop: "auto", height: 2, background: color.hair }} />
      <div style={{ position: "relative", display: "flex", gap: 56, marginTop: 30 }}>{stats}</div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          background: color.accent
        }}
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 30 }}>{value}</div>
      <div style={{ fontSize: 18, letterSpacing: ".04em", color: color.faint }}>{label}</div>
    </div>
  );
}

function Identifier({ path }: { path: string }) {
  return (
    <div style={{ fontSize: 64, lineHeight: 1.05, letterSpacing: "-.02em" }}>
      <span style={{ color: color.faint }}>{host}/</span>
      {path}
    </div>
  );
}

function Description({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    marginTop: 26,
    fontSize: 34,
    lineHeight: 1.35,
    color: color.muted
  };
  return <div style={style}>{children}</div>;
}

function titleSize(title: string): number {
  if (title.length <= 22) return 66;
  if (title.length <= 52) return 56;
  if (title.length <= 76) return 46;
  return 40;
}

export function HomeCard({ stats, locale, m }: { stats: HomeStats } & CardLanguage) {
  return (
    <Frame
      mark={LOGO}
      stats={
        <>
          <Stat value={formatNumber(stats.projects, locale)} label={m(LABEL.projects)} />
          {stats.stars !== undefined && (
            <Stat value={formatNumber(stats.stars, locale)} label={m(LABEL.stars)} />
          )}
          <Stat value={formatNumber(stats.servers, locale)} label={m(LABEL.servers)} />
        </>
      }
    >
      <Identifier path="home" />
      <Description>{m(SITE.description)}</Description>
    </Frame>
  );
}

/** `posts` are newest first, as the registry sorts them. */
export function BlogCard({ posts, locale, m }: { posts: readonly CardPost[] } & CardLanguage) {
  const latest = posts[0];
  return (
    <Frame
      mark={LOGO}
      stats={
        <>
          <Stat value={String(posts.length)} label={m(LABEL.posts)} />
          {latest && (
            <Stat value={formatShortDate(latest.publishedAt, locale)} label={m(LABEL.latest)} />
          )}
        </>
      }
    >
      <Identifier path="blog" />
      <Description>{m(BLOG_DESCRIPTION)}</Description>
    </Frame>
  );
}

export function PostCard({ post, locale, m }: { post: CardPost } & CardLanguage) {
  return (
    <Frame
      mark={post.icon ?? LOGO}
      stats={
        <>
          <Stat value={post.author} label={m(LABEL.author)} />
          <Stat value={formatShortDate(post.publishedAt, locale)} label={m(LABEL.published)} />
          <Stat value={post.topic} label={m(LABEL.topic)} />
        </>
      }
    >
      <div style={{ marginBottom: 22, fontFamily: MONO, fontSize: 26, color: color.faint }}>
        {host}
        {withLocale("/blog", locale)}/<span style={{ color: color.ink }}>{post.slug}</span>
      </div>
      <div style={{ fontSize: titleSize(post.title), lineHeight: 1.08, letterSpacing: "-.02em" }}>
        {post.title}
      </div>
    </Frame>
  );
}
