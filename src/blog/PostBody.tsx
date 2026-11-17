import type { MarkdownDocument } from "@tanstack/markdown";
import { Markdown, type MarkdownComponents } from "@tanstack/markdown/react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { outbound } from "#app/ui/outbound";
import { POST_ELEMENTS } from "./content/elements";
import * as styles from "./PostBody.css";

interface CalloutProps {
  kind: string;
  title: string;
  children?: ReactNode;
}

interface MediaProps {
  src: string;
  width: string;
  height: string;
  caption?: string;
  children?: ReactNode;
}

function Callout({ kind, title, children }: CalloutProps) {
  return (
    <div
      role="note"
      className={kind === "warning" ? `${styles.callout} ${styles.warning}` : styles.callout}
    >
      <span className={styles.label}>{title}</span>
      {children}
    </div>
  );
}

function PostImage({ src, alt, width, height, caption }: MediaProps & { alt: string }) {
  return (
    <figure>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function PostVideo({
  src,
  webm,
  poster,
  width,
  height,
  caption,
  children
}: MediaProps & { poster: string; webm?: string }) {
  const described = useId();
  return (
    <figure>
      <video
        aria-describedby={described}
        controls
        muted
        playsInline
        preload="metadata"
        poster={poster}
        width={width}
        height={height}
      >
        {webm && <source src={webm} type='video/webm; codecs="av01.0.08M.10"' />}
        <source src={src} type="video/mp4" />
      </video>
      <figcaption>
        {caption}
        <div id={described} className={styles.described}>
          {children}
        </div>
      </figcaption>
    </figure>
  );
}

function Anchor({ children, ...props }: ComponentProps<"a">) {
  return (
    <a {...props} {...outbound(props.href)}>
      {children}
    </a>
  );
}

const components = {
  a: Anchor,
  [POST_ELEMENTS.callout]: Callout,
  [POST_ELEMENTS.image]: PostImage,
  [POST_ELEMENTS.video]: PostVideo
} satisfies MarkdownComponents;

export function PostBody({ document }: { document: MarkdownDocument }) {
  return (
    <div className={styles.prose}>
      <Markdown components={components}>{document}</Markdown>
    </div>
  );
}
