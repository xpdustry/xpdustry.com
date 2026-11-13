import { msg } from "gt-tanstack-start";
import type { CSSProperties, ReactNode } from "react";
import { BLOG_DESCRIPTION } from "#app/blog/titles";
import { SITE_THEME } from "#app/blog/topics";
import logo from "#app/brand/logo.svg?raw";
import type { ProjectTheme } from "#app/brand/projects";
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
  /** The topic's colours: a project's own, or the site's. */
  theme: CardTheme;
}

export type CardTheme = Pick<ProjectTheme, "ground" | "muted" | "accent" | "chip">;

export interface HomeStats {
  projects: number;
  servers: number;
  /** Dropped rather than faked while GitHub has not answered. */
  stars?: number;
}

interface Palette {
  ground: string;
  ink: string;
  muted: string;
  faint: string;
  hair: string;
  bar: string;
}

/**
 * A card's colours, drawn from a dark theme ground. The ink leans white toward the theme's accent,
 * the description lifts the theme's muted text toward the ink and the small labels sink it a little
 * into the ground. The texture lightens the ground under the type's far edge, so the text is set
 * brighter than the flat ground needs; `palette.test.ts` measures it against the texture.
 */
export function cardPalette(theme: CardTheme): Palette {
  const ink = mix("#ffffff", theme.accent, 0.4);
  return {
    ground: theme.ground,
    ink,
    muted: mix(theme.muted, ink, 0.3),
    faint: mix(theme.muted, theme.ground, 0.1),
    hair: "rgba(255,255,255,.12)",
    bar: theme.chip.background
  };
}

/** Mixes two opaque `#rrggbb` colours, the only form the themes use. */
function mix(from: string, to: string, amount: number): string {
  const channels = (hex: string) => {
    if (!/^#[\da-f]{6}$/i.test(hex)) throw new Error(`Card colours must be #rrggbb, not ${hex}`);
    return [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16));
  };
  const target = channels(to);
  return `#${channels(from)
    .map((value, i) => Math.round(value + (target[i]! - value) * amount))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** The site's cards keep the brand teal for their bar, where a project's take its chip colour. */
const SITE_PALETTE: Palette = { ...cardPalette(SITE_THEME), bar: "#41c1ba" };

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
const TEXT = `${FACE.text}, ${FACE.cyrillicText}`;
const MONO = `${FACE.mono}, ${FACE.cyrillicMono}`;

const host = SITE.origin.replace("https://", "");
const LOGO = `data:image/svg+xml;base64,${Buffer.from(logo.replace(/<\?xml[^>]*\?>/, "")).toString("base64")}`;

interface FrameProps {
  palette: Palette;
  mark: string;
  stats: ReactNode;
  children: ReactNode;
}

function Frame({ palette, mark, stats, children }: FrameProps) {
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
        background: palette.ground,
        color: palette.ink,
        fontFamily: DISPLAY
      }}
    >
      <Texture />
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
      <div
        style={{ position: "relative", marginTop: "auto", height: 2, background: palette.hair }}
      />
      <div style={{ position: "relative", display: "flex", gap: 56, marginTop: 30 }}>{stats}</div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 12,
          background: palette.bar
        }}
      />
    </div>
  );
}

/** The reticulate pattern, soft-lit and building toward the mark, away from the type. */
export function Texture() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: 0.45,
        mixBlendMode: "soft-light",
        background: `url(${texture}) center / 620px 620px`,
        maskImage: "linear-gradient(115deg, transparent 26%, #000 82%)"
      }}
    />
  );
}

function Stat({ palette, value, label }: { palette: Palette; value: string; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ fontSize: 30 }}>{value}</div>
      <div
        style={{
          fontFamily: TEXT,
          fontWeight: 500,
          fontSize: 19,
          letterSpacing: ".04em",
          color: palette.faint
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Identifier({ path }: { path: string }) {
  return (
    <div style={{ fontSize: 64, lineHeight: 1.05, letterSpacing: "-.02em" }}>
      <span style={{ color: SITE_PALETTE.faint }}>{host}/</span>
      {path}
    </div>
  );
}

function Description({ children }: { children: ReactNode }) {
  const style: CSSProperties = {
    marginTop: 26,
    fontFamily: TEXT,
    fontWeight: 500,
    fontSize: 34,
    lineHeight: 1.35,
    color: SITE_PALETTE.muted
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
      palette={SITE_PALETTE}
      mark={LOGO}
      stats={
        <>
          <Stat
            palette={SITE_PALETTE}
            value={formatNumber(stats.projects, locale)}
            label={m(LABEL.projects)}
          />
          {stats.stars !== undefined && (
            <Stat
              palette={SITE_PALETTE}
              value={formatNumber(stats.stars, locale)}
              label={m(LABEL.stars)}
            />
          )}
          <Stat
            palette={SITE_PALETTE}
            value={formatNumber(stats.servers, locale)}
            label={m(LABEL.servers)}
          />
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
      palette={SITE_PALETTE}
      mark={LOGO}
      stats={
        <>
          <Stat palette={SITE_PALETTE} value={String(posts.length)} label={m(LABEL.posts)} />
          {latest && (
            <Stat
              palette={SITE_PALETTE}
              value={formatShortDate(latest.publishedAt, locale)}
              label={m(LABEL.latest)}
            />
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
  const palette = cardPalette(post.theme);
  return (
    <Frame
      palette={palette}
      mark={post.icon ?? LOGO}
      stats={
        <>
          <Stat palette={palette} value={post.author} label={m(LABEL.author)} />
          <Stat
            palette={palette}
            value={formatShortDate(post.publishedAt, locale)}
            label={m(LABEL.published)}
          />
          <Stat palette={palette} value={post.topic} label={m(LABEL.topic)} />
        </>
      }
    >
      <div style={{ marginBottom: 22, fontFamily: MONO, fontSize: 26, color: palette.faint }}>
        {host}
        {withLocale("/blog", locale)}/<span style={{ color: palette.ink }}>{post.slug}</span>
      </div>
      <div style={{ fontSize: titleSize(post.title), lineHeight: 1.08, letterSpacing: "-.02em" }}>
        {post.title}
      </div>
    </Frame>
  );
}
