// The social card frame: identifier, mark, hairline, stats strip and accent bar.
//
// Solid components rendered to HTML on the server and laid out by takumi, so
// the styles are the subset it shares with browsers: flexbox, absolute
// positioning, blend modes and masks, no grid or pseudo-elements.

import type { JSX } from "@solidjs/web";
import {
  Calendar,
  GitFork,
  Newspaper,
  Package,
  Server,
  Star,
  Tag,
  User,
  type IconNode,
} from "lucide";
import type { ParentProps } from "solid-js";
import logo from "#app/assets/logo.svg?raw";
import texture from "#app/assets/reticulate.png?inline";
import { projects } from "#app/data/projects";
import { servers } from "#app/data/servers";
import { BLOG_DESCRIPTION, SITE } from "#app/data/site";
import { formatShortDate } from "#app/lib/format";
import type { RepositoryStats } from "#app/server/og/github";

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

export interface CardPost {
  slug: string;
  title: string;
  author: string;
  topic: string;
  publishedAt: string;
}

const color = {
  accent: "#41c1ba",
  background: "#0b1218",
  ink: "#f0f3f6",
  muted: "#aab3ba",
  faint: "#7d858d",
  hair: "rgba(255,255,255,.1)",
} as const;

const ICON_SIZE = 26;
const ICON_GAP = 11;
// Widths are given in characters, as `ch` would, but takumi only takes absolute
// lengths inline, so they scale by Archivo's zero advance, measured in takumi.
const CH_BOLD = 0.6;
const CH_REGULAR = 0.57;
const DESCRIPTION_SIZE = 27;
const host = SITE.origin.replace("https://", "");
const logoUri = svgUri(logo.replace(/<\?xml[^>]*\?>/, ""));

function svgUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

// Icons go in as images: the SVG rasteriser ignores `currentColor`, so the
// stroke is set outright.
function iconUri(node: IconNode): string {
  const body = node
    .map(([tag, attributes]) => {
      const pairs = Object.entries(attributes).map(([key, value]) => `${key}="${value}"`);
      return `<${tag} ${pairs.join(" ")}/>`;
    })
    .join("");
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color.faint}"
      stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`,
  );
}

function Stat(props: { icon: IconNode; value: string; label: string }) {
  return (
    <div style={{ display: "flex", "flex-direction": "column", gap: "7px" }}>
      <div
        style={{
          display: "flex",
          "align-items": "center",
          gap: `${ICON_GAP}px`,
          "font-size": "28px",
          "font-weight": 600,
          color: color.ink,
        }}
      >
        <img
          src={iconUri(props.icon)}
          width={ICON_SIZE}
          height={ICON_SIZE}
          style={{ flex: "none" }}
        />
        <span>{props.value}</span>
      </div>
      <div
        style={{
          "font-size": "18px",
          "letter-spacing": ".04em",
          color: color.faint,
          "padding-left": `${ICON_SIZE + ICON_GAP}px`,
        }}
      >
        {props.label}
      </div>
    </div>
  );
}

function Frame(props: ParentProps<{ stats: JSX.Element }>) {
  return (
    <div
      style={{
        position: "relative",
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        overflow: "hidden",
        display: "flex",
        "flex-direction": "column",
        padding: "72px 80px 66px",
        background: color.background,
        "font-family": "Archivo",
      }}
    >
      {/* texture builds into the quadrant the mark occupies, leaving the type column clean */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          "z-index": 1,
          opacity: 0.75,
          background: `url(${texture}) center / 620px 620px`,
          "mix-blend-mode": "soft-light",
          "mask-image": "linear-gradient(115deg, transparent 26%, #000 82%)",
        }}
      />
      <div
        style={{
          position: "relative",
          "z-index": 2,
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          gap: "56px",
        }}
      >
        <div>{props.children}</div>
        <img src={logoUri} width={210} height={210} style={{ flex: "none" }} />
      </div>
      <div
        style={{
          position: "relative",
          "z-index": 2,
          "margin-top": "auto",
          height: "1px",
          background: color.hair,
        }}
      />
      <div
        style={{
          position: "relative",
          "z-index": 2,
          "margin-top": "32px",
          display: "flex",
          "align-items": "flex-end",
          gap: "52px",
        }}
      >
        {props.stats}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "10px",
          "z-index": 3,
          background: color.accent,
        }}
      />
    </div>
  );
}

function Title(props: ParentProps<{ size: number; chars: number }>) {
  return (
    <div
      style={{
        "font-weight": 700,
        "font-size": `${props.size}px`,
        "line-height": 1.12,
        "letter-spacing": "-.025em",
        color: color.ink,
        "max-width": `${Math.round(props.chars * CH_BOLD * props.size)}px`,
      }}
    >
      {props.children}
    </div>
  );
}

/** `xpdustry.com/` in a light weight, the section in bold, as GitHub sets `owner/repo`. */
function Identifier(props: { path: string }) {
  return (
    <Title size={60} chars={16}>
      <span style={{ "font-weight": 400, color: color.faint, "letter-spacing": "-.015em" }}>
        {host}/
      </span>
      {props.path}
    </Title>
  );
}

function Description(props: ParentProps<{ chars: number }>) {
  return (
    <div
      style={{
        "margin-top": "24px",
        "font-size": `${DESCRIPTION_SIZE}px`,
        "line-height": 1.45,
        color: color.muted,
        "max-width": `${Math.round(props.chars * CH_REGULAR * DESCRIPTION_SIZE)}px`,
      }}
    >
      {props.children}
    </div>
  );
}

/** Real post titles run from twelve to ninety characters, so the scale follows the length. */
function titleScale(title: string): { size: number; chars: number } {
  if (title.length <= 22) return { size: 62, chars: 15 };
  if (title.length <= 52) return { size: 54, chars: 20 };
  if (title.length <= 76) return { size: 44, chars: 25 };
  return { size: 38, chars: 29 };
}

/** The stars and forks are dropped rather than faked when GitHub is unreachable. */
export function HomeCard(props: { github: RepositoryStats | undefined }) {
  return (
    <Frame
      stats={
        <>
          <Stat icon={Package} value={String(projects.length)} label="Projects" />
          {props.github && <Stat icon={Star} value={String(props.github.stars)} label="Stars" />}
          {props.github && <Stat icon={GitFork} value={String(props.github.forks)} label="Forks" />}
          <Stat icon={Server} value={String(servers.length)} label="Servers" />
        </>
      }
    >
      <Identifier path="home" />
      <Description chars={40}>{SITE.description}</Description>
    </Frame>
  );
}

/** `posts` are newest first, as the registry sorts them. */
export function BlogCard(props: { posts: readonly CardPost[] }) {
  const latest = props.posts[0];
  return (
    <Frame
      stats={
        <>
          <Stat icon={Newspaper} value={String(props.posts.length)} label="Posts" />
          {latest && (
            <Stat icon={Calendar} value={formatShortDate(latest.publishedAt)} label="Latest" />
          )}
        </>
      }
    >
      <Identifier path="blog" />
      <Description chars={46}>{BLOG_DESCRIPTION}</Description>
    </Frame>
  );
}

export function PostCard(props: { post: CardPost }) {
  const scale = titleScale(props.post.title);
  return (
    <Frame
      stats={
        <>
          <Stat icon={User} value={props.post.author} label="Author" />
          <Stat icon={Calendar} value={formatShortDate(props.post.publishedAt)} label="Published" />
          <Stat icon={Tag} value={props.post.topic} label="Topic" />
        </>
      }
    >
      <div
        style={{
          "font-family": "Martian",
          "font-size": "21px",
          color: color.faint,
          "margin-bottom": "18px",
        }}
      >
        {host}/blog/<span style={{ color: color.ink }}>{props.post.slug}</span>
      </div>
      <Title size={scale.size} chars={scale.chars}>
        {props.post.title}
      </Title>
    </Frame>
  );
}
