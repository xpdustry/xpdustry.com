import type { CSSProperties, ReactNode } from "react";
import logo from "#app/assets/logo.svg?raw";
import texture from "#app/assets/reticulate.png?inline";
import { BLOG_DESCRIPTION, SITE } from "#app/data/site";
import { formatShortDate } from "#app/lib/format";
import { CARD_SIZE } from "#app/lib/seo";

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
  hair: "rgba(255,255,255,.14)",
} as const;

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
        fontFamily: "Momo Trust Display",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          background: `url(${texture}) 0 0 / 300px 300px`,
          maskImage: "linear-gradient(115deg, transparent 22%, #000 78%)",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 56,
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
          background: color.accent,
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
    color: color.muted,
  };
  return <div style={style}>{children}</div>;
}

function titleSize(title: string): number {
  if (title.length <= 22) return 66;
  if (title.length <= 52) return 56;
  if (title.length <= 76) return 46;
  return 40;
}

export function HomeCard({ stats }: { stats: HomeStats }) {
  return (
    <Frame
      mark={LOGO}
      stats={
        <>
          <Stat value={String(stats.projects)} label="Projects" />
          {stats.stars !== undefined && <Stat value={String(stats.stars)} label="Stars" />}
          <Stat value={String(stats.servers)} label="Servers" />
        </>
      }
    >
      <Identifier path="home" />
      <Description>{SITE.description}</Description>
    </Frame>
  );
}

/** `posts` are newest first, as the registry sorts them. */
export function BlogCard({ posts }: { posts: readonly CardPost[] }) {
  const latest = posts[0];
  return (
    <Frame
      mark={LOGO}
      stats={
        <>
          <Stat value={String(posts.length)} label="Posts" />
          {latest && <Stat value={formatShortDate(latest.publishedAt)} label="Latest" />}
        </>
      }
    >
      <Identifier path="blog" />
      <Description>{BLOG_DESCRIPTION}</Description>
    </Frame>
  );
}

export function PostCard({ post }: { post: CardPost }) {
  return (
    <Frame
      mark={post.icon ?? LOGO}
      stats={
        <>
          <Stat value={post.author} label="Author" />
          <Stat value={formatShortDate(post.publishedAt)} label="Published" />
          <Stat value={post.topic} label="Topic" />
        </>
      }
    >
      <div style={{ marginBottom: 22, fontFamily: "DM Mono", fontSize: 26, color: color.faint }}>
        {host}/blog/<span style={{ color: color.ink }}>{post.slug}</span>
      </div>
      <div style={{ fontSize: titleSize(post.title), lineHeight: 1.08, letterSpacing: "-.02em" }}>
        {post.title}
      </div>
    </Frame>
  );
}
